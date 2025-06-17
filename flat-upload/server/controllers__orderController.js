// controllers/orderController.js
const mongoose = require('mongoose');
const Order = mongoose.model('Order');
const OrderItem = mongoose.model('OrderItem');
const Product = mongoose.model('Product');
const Table = mongoose.model('Table');

/**
 * Adicionar item ao pedido
 */
exports.addItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { productId, quantity, notes } = req.body;
    
    // Validação
    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Produto e quantidade são obrigatórios' 
      });
    }
    
    // Buscar ordem
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Pedido não encontrado' 
      });
    }
    
    // Verificar se o pedido está aberto
    if (order.status !== 'open') {
      return res.status(400).json({ 
        success: false, 
        message: 'Não é possível adicionar itens a um pedido fechado' 
      });
    }
    
    // Buscar produto
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Produto não encontrado' 
      });
    }
    
    // Verificar disponibilidade
    if (!product.available) {
      return res.status(400).json({ 
        success: false, 
        message: 'Produto indisponível' 
      });
    }
    
    // Criar item do pedido
    const orderItem = new OrderItem({
      product: product._id,
      quantity,
      unitPrice: product.price,
      notes
    });
    
    await orderItem.save();
    
    // Adicionar item ao pedido
    order.items.push(orderItem._id);
    await order.save();
    
    // Buscar item com dados do produto
    const populatedItem = await OrderItem.findById(orderItem._id).populate('product');
    
    // Emitir eventos
    const socketEvents = req.app.get('socketEvents');
    if (socketEvents) {
      socketEvents.emitOrderUpdate(order._id, order.table, 'item_added');
      socketEvents.emitNewOrder({ 
        orderId: order._id, 
        tableId: order.table, 
        item: populatedItem 
      });
    }
    
    res.status(201).json({
      success: true,
      item: populatedItem,
      order
    });
  } catch (error) {
    console.error('Erro ao adicionar item:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};

/**
 * Listar itens do pedido
 */
exports.listItems = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Pedido não encontrado' 
      });
    }
    
    // Buscar itens com informações do produto
    const items = await OrderItem.find({ _id: { $in: order.items } })
      .populate('product', 'name price image');
    
    res.json({
      success: true,
      items,
      order
    });
  } catch (error) {
    console.error('Erro ao listar itens:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};

/**
 * Atualizar status do item
 */
exports.updateItemStatus = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { status } = req.body;
    
    // Validação
    if (!status) {
      return res.status(400).json({ 
        success: false, 
        message: 'Status é obrigatório' 
      });
    }
    
    // Validar status
    const validStatus = ['pending', 'preparing', 'ready', 'delivered', 'canceled'];
    if (!validStatus.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Status inválido' 
      });
    }
    
    // Buscar item
    const item = await OrderItem.findById(itemId);
    if (!item) {
      return res.status(404).json({ 
        success: false, 
        message: 'Item não encontrado' 
      });
    }
    
    // Atualizar timestamp baseado no status
    if (status === 'preparing' && !item.preparationStartTime) {
      item.preparationStartTime = new Date();
    }
    
    if (status === 'delivered' && !item.deliveryTime) {
      item.deliveryTime = new Date();
    }
    
    // Atualizar status
    item.status = status;
    await item.save();
    
    // Buscar ordem relacionada
    const order = await Order.findOne({ items: itemId });
    
    // Emitir evento
    if (order) {
      const socketEvents = req.app.get('socketEvents');
      if (socketEvents) {
        socketEvents.emitOrderUpdate(order._id, order.table, status);
      }
    }
    
    res.json({
      success: true,
      item
    });
  } catch (error) {
    console.error('Erro ao atualizar status do item:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};

/**
 * Remover item do pedido
 */
exports.removeItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    
    // Buscar item
    const item = await OrderItem.findById(itemId);
    if (!item) {
      return res.status(404).json({ 
        success: false, 
        message: 'Item não encontrado' 
      });
    }
    
    // Buscar ordem relacionada
    const order = await Order.findOne({ items: itemId });
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: 'Pedido não encontrado' 
      });
    }
    
    // Verificar se o pedido está aberto
    if (order.status !== 'open') {
      return res.status(400).json({ 
        success: false, 
        message: 'Não é possível remover itens de um pedido fechado' 
      });
    }
    
    // Remover item da ordem
    order.items = order.items.filter(id => id.toString() !== itemId);
    await order.save();
    
    // Remover item
    await OrderItem.findByIdAndDelete(itemId);
    
    // Emitir evento
    const socketEvents = req.app.get('socketEvents');
    if (socketEvents) {
      socketEvents.emitOrderUpdate(order._id, order.table, 'item_removed');
    }
    
    res.json({
      success: true,
      message: 'Item removido com sucesso'
    });
  } catch (error) {
    console.error('Erro ao remover item:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};