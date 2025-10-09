// controllers/tableController.js
const mongoose = require('mongoose');
const Table = mongoose.model('Table');
const Order = mongoose.model('Order');
const CashRegister = mongoose.model('CashRegister');
const CashTransaction = mongoose.model('CashTransaction');

/**
 * List all tables
 * FIXED: Garçons agora veem todas as mesas (podem assumir mesas livres)
 */
exports.listTables = async (req, res) => {
  try {
    // Garçons veem todas as mesas (livres e ocupadas)
    // Isso permite que eles assumam mesas livres quando clientes chegarem
    const tables = await Table.find({})
      .populate('waiter', 'name')
      .populate({
        path: 'currentOrder',
        populate: {
          path: 'customer',
          select: 'name cpf phone email visitCount'
        }
      })
      .sort({ number: 1 }); // Ordenar por número da mesa

    res.json({ success: true, tables });
  } catch (error) {
    console.error('Error listing tables:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Get a table by ID
 */
exports.getTable = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id)
      .populate('waiter', 'name')
      .populate({
        path: 'currentOrder',
        populate: {
          path: 'customer',
          select: 'name cpf phone email visitCount'
        }
      });

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    res.json({ success: true, table });
  } catch (error) {
    console.error('Error getting table:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Create a new table
 */
exports.createTable = async (req, res) => {
  try {
    // Only admin and manager can create tables
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }
    
    const { number, position, section } = req.body;
    
    // Validate data
    if (!number) {
      return res.status(400).json({ 
        success: false, 
        message: 'Table number is required' 
      });
    }
    
    // Check if table already exists
    const existingTable = await Table.findOne({ number });
    if (existingTable) {
      return res.status(400).json({ 
        success: false, 
        message: 'Table already exists' 
      });
    }
    
    // Create table
    const table = new Table({
      number,
      position: position || { x: 0, y: 0 },
      section: section || 'main'
    });
    
    await table.save();
    
    // Emit update event
    const socketEvents = req.app.get('socketEvents');
    if (socketEvents) {
      socketEvents.emitTableUpdate(table._id);
    }
    
    res.status(201).json({
      success: true,
      table
    });
  } catch (error) {
    console.error('Error creating table:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

/**
 * Delete a table
 */
exports.deleteTable = async (req, res) => {
  try {
    // Only admin and manager can delete tables
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }
    
    const { id } = req.params;
    
    // Check if table exists
    const table = await Table.findById(id);
    if (!table) {
      return res.status(404).json({ 
        success: false, 
        message: 'Table not found' 
      });
    }
    
    // Check if table is free
    if (table.status !== 'free') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete an occupied table' 
      });
    }
    
    // Check if table has associated orders
    const hasOrders = await Order.exists({ table: id });
    if (hasOrders) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete a table with order history. Consider deactivating it instead.' 
      });
    }
    
    // Delete table
    await Table.findByIdAndDelete(id);
    
    // Emit update event
    const socketEvents = req.app.get('socketEvents');
    if (socketEvents) {
      socketEvents.emitTableUpdate(id);
      socketEvents.emitDataUpdate();
    }
    
    res.json({
      success: true,
      message: 'Table deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting table:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

/**
 * Open a table
 */
exports.openTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { occupants } = req.body;
    
    // Get table
    const table = await Table.findById(id);
    if (!table) {
      return res.status(404).json({ 
        success: false, 
        message: 'Table not found' 
      });
    }
    
    // Check if table is already occupied
    if (table.status !== 'free') {
      return res.status(400).json({ 
        success: false, 
        message: 'Table is already occupied' 
      });
    }
    
    // Update table
    table.status = 'occupied';
    table.openTime = new Date();
    table.occupants = occupants || 1;
    table.waiter = req.user.id;
    
    await table.save();
    
    // Create order for the table
    const order = new Order({
      table: table._id,
      waiter: req.user.id,
      items: []
    });
    
    await order.save();
    
    // Update table with current order
    table.currentOrder = order._id;
    await table.save();
    
    // Emit update event
    const socketEvents = req.app.get('socketEvents');
    if (socketEvents) {
      socketEvents.emitTableUpdate(table._id);
      socketEvents.emitDataUpdate();
    }
    
    res.json({
      success: true,
      table,
      order
    });
  } catch (error) {
    console.error('Error opening table:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

/**
 * Transfer a table
 */
exports.transferTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetTableId } = req.body;
    
    // Validate data
    if (!targetTableId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Target table is required' 
      });
    }
    
    // Get tables
    const sourceTable = await Table.findById(id);
    const targetTable = await Table.findById(targetTableId);
    
    if (!sourceTable || !targetTable) {
      return res.status(404).json({ 
        success: false, 
        message: 'Table not found' 
      });
    }
    
    // Check if source table is occupied
    if (sourceTable.status !== 'occupied') {
      return res.status(400).json({ 
        success: false, 
        message: 'Source table is not occupied' 
      });
    }
    
    // Check if target table is free
    if (targetTable.status !== 'free') {
      return res.status(400).json({ 
        success: false, 
        message: 'Target table is already occupied' 
      });
    }
    
    // Transfer data
    targetTable.status = 'occupied';
    targetTable.openTime = sourceTable.openTime;
    targetTable.occupants = sourceTable.occupants;
    targetTable.waiter = sourceTable.waiter;
    targetTable.currentOrder = sourceTable.currentOrder;
    
    // Free source table
    sourceTable.status = 'free';
    sourceTable.openTime = null;
    sourceTable.occupants = 0;
    sourceTable.waiter = null;
    sourceTable.currentOrder = null;
    
    // Update order
    if (targetTable.currentOrder) {
      await Order.findByIdAndUpdate(targetTable.currentOrder, { table: targetTable._id });
    }
    
    // Save changes
    await Promise.all([sourceTable.save(), targetTable.save()]);
    
    // Emit update events
    const socketEvents = req.app.get('socketEvents');
    if (socketEvents) {
      socketEvents.emitTableUpdate(sourceTable._id);
      socketEvents.emitTableUpdate(targetTable._id);
      socketEvents.emitDataUpdate();
    }
    
    res.json({
      success: true,
      sourceTable,
      targetTable
    });
  } catch (error) {
    console.error('Error transferring table:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

/**
 * Close a table - BUG FIX #4: WITH MONGODB TRANSACTIONS
 */
exports.closeTable = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { paymentMethod, cashReceived, change } = req.body;

    // SECURITY: Only staff can close tables
    if (!req.user || !['admin', 'manager', 'waiter'].includes(req.user.role)) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: 'Apenas funcionários autorizados podem fechar mesas'
      });
    }

    // Validate data
    if (!paymentMethod) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Payment method is required'
      });
    }

    // Get table with session
    const table = await Table.findById(id).session(session);

    if (!table) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    // Check if table is occupied
    if (table.status !== 'occupied' && table.status !== 'waiting_payment') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Table is not occupied'
      });
    }

    let order = null;
    let transaction = null;

    if (table.currentOrder) {
      // Get order with session
      order = await Order.findById(table.currentOrder).session(session);

      if (!order) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: 'No active order for this table'
        });
      }

      console.log(`[Transaction] Closing order ${order._id} with payment ${paymentMethod}`);

      // VALIDAÇÃO: Verificar se todos os itens estão entregues
      const OrderItem = require('../models/OrderItem');
      const pendingItems = await OrderItem.find({
        _id: { $in: order.items },
        status: { $in: ['pending', 'preparing', 'ready'] }
      }).session(session);

      if (pendingItems.length > 0) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Não é possível fechar a mesa. Existem ${pendingItems.length} item(ns) que ainda não foram entregues. Marque todos os itens como "Entregue" antes de fechar.`,
          pendingItems: pendingItems.map(item => ({
            id: item._id,
            status: item.status
          }))
        });
      }

      // 1. Update order status
      order.status = 'closed';
      order.paymentMethod = paymentMethod;
      order.paymentStatus = 'paid';
      order.closedAt = new Date();
      await order.save({ session });

      // 2. Create cash transaction
      const cashRegister = await CashRegister.findOne({
        status: 'open'
      }).session(session);

      if (!cashRegister) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: 'No open cash register found'
        });
      }

      // Salvar saldo anterior
      const previousBalance = cashRegister.currentBalance || 0;

      transaction = new CashTransaction({
        cashRegister: cashRegister._id,
        order: order._id,
        type: 'deposit', // Entrada de dinheiro por venda
        amount: order.total,
        description: `Venda - Mesa ${table.number} - Pagamento: ${paymentMethod}`,
        user: req.user._id,
        previousBalance: previousBalance,
        newBalance: previousBalance + order.total,
        paymentDetails: {
          cash: paymentMethod === 'cash' ? order.total : 0,
          credit: paymentMethod === 'credit' ? order.total : 0,
          debit: paymentMethod === 'debit' ? order.total : 0,
          pix: paymentMethod === 'pix' ? order.total : 0,
          other: !['cash', 'credit', 'debit', 'pix'].includes(paymentMethod) ? order.total : 0
        }
      });
      await transaction.save({ session });

      // 3. Update cash register
      cashRegister.currentBalance = previousBalance + order.total;
      await cashRegister.save({ session });

      console.log(`[Transaction] Cash register updated: +${order.total}`);
    }

    // 4. Update customer profile (if customer order)
    let profileUpdate = null;
    if (order && order.customer) {
      const Customer = mongoose.model('Customer');
      const customer = await Customer.findById(order.customer).session(session);

      if (customer) {
        try {
          profileUpdate = await customer.updateProfile(order);
          console.log(`[Profile] Updated customer ${customer.name}: ${profileUpdate.pointsEarned} points, tier: ${profileUpdate.newTier}`);
        } catch (err) {
          console.error(`[Profile] Error updating customer profile:`, err);
        }
      }
    }

    // 5. Free table
    table.status = 'free';
    table.openTime = null;
    table.occupants = 0;
    table.waiter = null;
    table.currentOrder = null;
    await table.save({ session });

    // All OK, commit transaction
    await session.commitTransaction();
    console.log(`[Transaction] Committed successfully for table ${table.number}`);

    // Emit events AFTER commit
    const socketEvents = req.app.get('socketEvents');
    if (socketEvents) {
      if (order) {
        socketEvents.emitOrderUpdate(order._id, table._id, 'closed');
      }
      socketEvents.emitTableUpdate(table._id);
      setTimeout(() => {
        socketEvents.emitDataUpdate();
      }, 100);
    }

    res.json({
      success: true,
      message: 'Mesa fechada com sucesso',
      table,
      order,
      transaction
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('[Transaction] Error closing table, rolled back:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao fechar mesa',
      error: error.message
    });
  } finally {
    session.endSession();
  }
};

/**
 * Update table position
 */
exports.updateTablePosition = async (req, res) => {
  try {
    // Only admin and manager can update positions
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized' 
      });
    }
    
    const { id } = req.params;
    const { x, y } = req.body;
    
    // Validate data
    if (x === undefined || y === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Position (x, y) is required' 
      });
    }
    
    // Update table
    const table = await Table.findByIdAndUpdate(
      id,
      { position: { x, y } },
      { new: true }
    );
    
    if (!table) {
      return res.status(404).json({ 
        success: false, 
        message: 'Table not found' 
      });
    }
    
    // Emit update event
    const socketEvents = req.app.get('socketEvents');
    if (socketEvents) {
      socketEvents.emitTableUpdate(table._id);
    }
    
    res.json({
      success: true,
      table
    });
  } catch (error) {
    console.error('Error updating table position:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
};

/**
 * Assign a waiter to a table
 */
exports.assignWaiter = async (req, res) => {
  try {
    // Apenas administradores e gerentes podem atribuir garçons
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({
        success: false,
        message: 'Apenas administradores e gerentes podem atribuir garçons'
      });
    }
    
    const { id } = req.params;
    const { waiterId } = req.body;
    
    // Verificar se a mesa existe
    const table = await Table.findById(id);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Mesa não encontrada'
      });
    }
    
    // Verificar se o garçom existe, se um ID for fornecido
    if (waiterId) {
      const User = mongoose.model('User');
      const waiter = await User.findOne({ _id: waiterId, role: 'waiter', active: true });
      
      if (!waiter) {
        return res.status(404).json({
          success: false,
          message: 'Garçom não encontrado ou inativo'
        });
      }
    }
    
    // Atualizar a mesa com o novo garçom (ou remover o garçom se waiterId for null)
    table.waiter = waiterId || null;
    await table.save();
    
    // Se a mesa tiver um pedido em aberto, atualizar o garçom do pedido também
    if (table.currentOrder) {
      const order = await Order.findById(table.currentOrder);
      if (order && order.status === 'open') {
        order.waiter = waiterId || req.user.id; // Se remover o garçom, usar o admin como backup
        await order.save();
      }
    }
    
    // Emitir evento de atualização
    const socketEvents = req.app.get('socketEvents');
    if (socketEvents) {
      socketEvents.emitTableUpdate(table._id);
    }
    
    // Retornar sucesso
    res.json({
      success: true,
      message: waiterId ? 'Garçom atribuído com sucesso' : 'Garçom removido da mesa',
      table: {
        ...table.toObject(),
        waiter: waiterId // Simplificado para o cliente
      }
    });
  } catch (error) {
    console.error('Erro ao atribuir garçom:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao atribuir garçom',
      error: error.message
    });
  }
};