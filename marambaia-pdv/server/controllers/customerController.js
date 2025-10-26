// controllers/customerController.js
const mongoose = require('mongoose');
const Customer = mongoose.model('Customer');
const Order = mongoose.model('Order');
const OrderItem = mongoose.model('OrderItem');
const Product = mongoose.model('Product');
const Table = mongoose.model('Table');
const WaiterCall = require('../models/WaiterCall');

/**
 * Create customer command (comanda)
 */
exports.createCommand = async (req, res) => {
  try {
    const { tableToken, name, cpf, phone, email } = req.body;

    // Validate required fields
    if (!tableToken || !name) {
      return res.status(400).json({
        success: false,
        message: 'Token da mesa e nome são obrigatórios'
      });
    }

    // CPF is now REQUIRED for security
    if (!cpf) {
      return res.status(400).json({
        success: false,
        message: 'CPF é obrigatório para criar sua comanda. Isso garante que apenas você possa acessar seu pedido.',
        requiresCpf: true
      });
    }

    // Validate CPF format (11 digits)
    const cpfClean = cpf.replace(/\D/g, '');
    if (cpfClean.length !== 11) {
      return res.status(400).json({
        success: false,
        message: 'CPF inválido. Digite um CPF válido com 11 dígitos.',
        invalidCpf: true
      });
    }

    // If verifiedTable exists from middleware, use it
    const table = req.verifiedTable || await Table.findOne({ qrToken: tableToken });

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Mesa não encontrada'
      });
    }

    // Check if table already has an active customer order
    if (table.currentOrder) {
      const existingOrder = await Order.findById(table.currentOrder).populate('customer');
      if (existingOrder && existingOrder.status === 'open' && existingOrder.orderType === 'customer_self') {
        // Verify CPF matches existing order
        if (existingOrder.customer.cpf === cpfClean) {
          // Same customer, return existing order
          return res.status(200).json({
            success: true,
            message: 'Bem-vindo de volta!',
            existingOrder: true,
            order: existingOrder,
            customer: existingOrder.customer,
            table: {
              _id: table._id,
              number: table.number
            }
          });
        } else {
          // Different CPF, table is occupied by someone else
          return res.status(403).json({
            success: false,
            message: 'Esta mesa já está ocupada por outro cliente.',
            tableOccupied: true
          });
        }
      }
    }

    // Check if table is free or can accept customer orders
    if (table.status === 'occupied' && table.currentOrder) {
      // Check if it's a waiter order
      const existingOrder = await Order.findById(table.currentOrder);
      if (existingOrder && existingOrder.orderType === 'waiter') {
        return res.status(400).json({
          success: false,
          message: 'Esta mesa está sendo atendida por um garçom'
        });
      }
    }

    // Find or create customer
    const customer = await Customer.findOrCreate({ name, cpf: cpfClean, phone, email });

    // CRITICAL SECURITY: Check if customer is blacklisted
    if (customer.isBlacklisted()) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Entre em contato com o gerente.',
        blacklisted: true,
        reason: customer.blacklistReason,
        contactManager: true
      });
    }

    // Create new order
    const order = new Order({
      table: table._id,
      customer: customer._id,
      orderType: 'customer_self',
      items: [],
      status: 'open'
    });

    await order.save();

    // BUG FIX #1: Use atomic findOneAndUpdate to prevent race condition
    const updatedTable = await Table.findOneAndUpdate(
      {
        _id: table._id,
        currentOrder: null  // Only update if currentOrder is still null
      },
      {
        status: 'occupied',
        openTime: new Date(),
        currentOrder: order._id
      },
      { new: true }
    );

    // If update failed, another request won the race
    if (!updatedTable) {
      // Clean up orphaned order
      await Order.findByIdAndDelete(order._id);
      return res.status(409).json({
        success: false,
        message: 'Esta mesa já está sendo usada. Recarregue a página.',
        code: 'TABLE_ALREADY_OCCUPIED'
      });
    }

    // Update customer
    customer.currentOrder = order._id;
    customer.orderHistory.push(order._id);
    await customer.save();

    // Emit socket event
    const socketEvents = req.app.get('socketEvents');
    if (socketEvents) {
      socketEvents.emitTableUpdate(updatedTable._id);
      socketEvents.emitCustomerOrderCreated(order._id, updatedTable._id, customer);
    }

    res.status(201).json({
      success: true,
      message: 'Comanda criada com sucesso',
      order,
      customer,
      table: {
        _id: updatedTable._id,
        number: updatedTable.number
      }
    });
  } catch (error) {
    console.error('Erro ao criar comanda:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao criar comanda',
      error: error.message
    });
  }
};

/**
 * Get customer order by ID
 */
exports.getOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate('table', 'number')
      .populate('customer', 'name cpf')
      .populate({
        path: 'items',
        populate: {
          path: 'product',
          select: 'name price image description category'
        }
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado'
      });
    }

    // Only return customer self-service orders
    if (order.orderType !== 'customer_self') {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar pedido',
      error: error.message
    });
  }
};

/**
 * Add item to customer order
 */
exports.addItem = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { productId, quantity, notes } = req.body;

    // Validate
    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Produto e quantidade são obrigatórios'
      });
    }

    // Find order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado'
      });
    }

    // Verify it's a customer order
    if (order.orderType !== 'customer_self') {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }

    // Verify order is open
    if (order.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'Não é possível adicionar itens a um pedido fechado'
      });
    }

    // Find product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produto não encontrado'
      });
    }

    // Check availability
    if (!product.available) {
      return res.status(400).json({
        success: false,
        message: 'Produto indisponível'
      });
    }

    // BUG FIX #2: Use atomic transaction to add item
    const result = await Order.addItemSafe(orderId, {
      product: product._id,
      quantity,
      unitPrice: product.price,
      notes: notes || null
    });

    // Populate item with product data
    const populatedItem = await OrderItem.findById(result.item._id).populate('product');

    // Get updated order with all populated data for socket event
    const updatedOrder = await Order.findById(order._id)
      .populate('table', 'number')
      .populate('customer', 'name cpf')
      .populate({
        path: 'items',
        populate: {
          path: 'product',
          select: 'name price image description category'
        }
      });

    // Emit socket event with updated order data
    const socketEvents = req.app.get('socketEvents');
    if (socketEvents) {
      socketEvents.emitOrderUpdate(order._id, order.table, 'item_added', updatedOrder);
      socketEvents.emitNewOrder({
        orderId: order._id,
        tableId: order.table,
        item: populatedItem
      });
    }

    res.status(201).json({
      success: true,
      message: 'Item adicionado com sucesso',
      item: populatedItem,
      order: result.order
    });
  } catch (error) {
    console.error('Erro ao adicionar item:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao adicionar item',
      error: error.message
    });
  }
};

/**
 * Remove item from customer order
 */
exports.removeItem = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;

    // Find order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado'
      });
    }

    // Verify it's a customer order
    if (order.orderType !== 'customer_self') {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }

    // Verify order is open
    if (order.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'Não é possível remover itens de um pedido fechado'
      });
    }

    // Find item
    const item = await OrderItem.findById(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item não encontrado'
      });
    }

    // Check if item can be removed (not already preparing/delivered)
    if (item.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Item já está em preparo e não pode ser removido'
      });
    }

    // BUG FIX #10: Use atomic transaction to remove item
    await Order.removeItemSafe(orderId, itemId);

    // Get updated order with all populated data for socket event
    const updatedOrder = await Order.findById(order._id)
      .populate('table', 'number')
      .populate('customer', 'name cpf')
      .populate({
        path: 'items',
        populate: {
          path: 'product',
          select: 'name price image description category'
        }
      });

    // Emit socket event with updated order data
    const socketEvents = req.app.get('socketEvents');
    if (socketEvents) {
      socketEvents.emitOrderUpdate(order._id, order.table, 'item_removed', updatedOrder);
    }

    res.json({
      success: true,
      message: 'Item removido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover item:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao remover item',
      error: error.message
    });
  }
};

/**
 * Request bill for customer order
 */
exports.requestBill = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Find order
    const order = await Order.findById(orderId)
      .populate('table')
      .populate('customer');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado'
      });
    }

    // Verify it's a customer order
    if (order.orderType !== 'customer_self') {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }

    // Verify order is open
    if (order.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'Este pedido já foi finalizado'
      });
    }

    // Recalculate total
    await Order.recalculateTotal(order._id);

    // Update table status to waiting payment
    const table = await Table.findById(order.table);
    if (table) {
      table.status = 'waiting_payment';
      await table.save();
    }

    // Emit socket event to notify staff
    const socketEvents = req.app.get('socketEvents');
    if (socketEvents) {
      socketEvents.emitBillRequested(order._id, order.table._id, order.customer);
      socketEvents.emitTableUpdate(order.table._id);
    }

    res.json({
      success: true,
      message: 'Conta solicitada! Um garçom irá atendê-lo em breve.',
      order
    });
  } catch (error) {
    console.error('Erro ao solicitar conta:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao solicitar conta',
      error: error.message
    });
  }
};

/**
 * Get available products (public)
 */
exports.getProducts = async (req, res) => {
  try {
    const { category } = req.query;

    const filter = { available: true };
    if (category) {
      filter.category = category;
    }

    const products = await Product.find(filter)
      .populate('category', 'name')
      .sort({ name: 1 });

    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Erro ao buscar produtos:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar produtos',
      error: error.message
    });
  }
};

/**
 * Call waiter - Cliente chama o garçom
 */
exports.callWaiter = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason = 'assistance', customReason } = req.body;

    // Find order
    const order = await Order.findById(orderId)
      .populate('table')
      .populate('customer');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido não encontrado'
      });
    }

    // Verify it's a customer order
    if (order.orderType !== 'customer_self') {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado'
      });
    }

    // Verify order is open
    if (order.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'Este pedido já foi finalizado'
      });
    }

    // Check if there's already a pending call for this table
    const existingCall = await WaiterCall.findOne({
      table: order.table._id,
      status: { $in: ['pending', 'attending'] }
    });

    if (existingCall) {
      return res.status(400).json({
        success: false,
        message: 'Já existe uma solicitação em andamento. O garçom já foi avisado!',
        existingCall: true
      });
    }

    // Create waiter call
    const waiterCall = new WaiterCall({
      table: order.table._id,
      order: order._id,
      customer: order.customer._id,
      waiter: order.table.waiter || null,
      reason,
      customReason: customReason || null
    });

    await waiterCall.save();

    // Emit socket event to notify waiters
    const socketEvents = req.app.get('socketEvents');
    if (socketEvents) {
      socketEvents.emitWaiterCalled(
        order._id,
        order.table._id,
        order.customer,
        reason
      );
    }

    res.json({
      success: true,
      message: 'Garçom chamado com sucesso! Ele já foi notificado.',
      call: waiterCall
    });
  } catch (error) {
    console.error('[Call Waiter] Erro:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao chamar garçom',
      error: error.message
    });
  }
};
