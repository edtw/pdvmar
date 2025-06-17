// controllers/tableController.js
const mongoose = require('mongoose');
const Table = mongoose.model('Table');
const Order = mongoose.model('Order');
const CashRegister = mongoose.model('CashRegister');
const CashTransaction = mongoose.model('CashTransaction');

/**
 * List all tables
 */
exports.listTables = async (req, res) => {
  try {
    // Filter by waiter if user is a waiter
    const filter = req.user.role === 'waiter' ? { waiter: req.user.id } : {};
    
    const tables = await Table.find(filter)
      .populate('waiter', 'name')
      .populate('currentOrder');
    
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
      .populate('currentOrder');
    
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
 * Close a table - FIXED WITHOUT TRANSACTIONS
 */
exports.closeTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod, cashReceived, change } = req.body;
    
    // Validate data
    if (!paymentMethod) {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment method is required' 
      });
    }
    
    // Get table
    const table = await Table.findById(id);
    if (!table) {
      return res.status(404).json({ 
        success: false, 
        message: 'Table not found' 
      });
    }
    
    // Check if table is occupied
    if (table.status !== 'occupied' && table.status !== 'waiting_payment') {
      return res.status(400).json({ 
        success: false, 
        message: 'Table is not occupied' 
      });
    }
    
    // Get and close order
    let order = null;
    if (table.currentOrder) {
      // Get order
      order = await Order.findById(table.currentOrder);
      
      if (order) {
        console.log(`Closing order ${order._id} with payment method ${paymentMethod}`);
        
        // FIXED: First recalculate total
        await Order.recalculateTotal(order._id);
        
        // Get the updated order to confirm total is correct
        order = await Order.findById(order._id);
        
        if (!order) {
          return res.status(404).json({ 
            success: false, 
            message: 'Order not found after recalculation' 
          });
        }
        
        console.log(`Order ${order._id} total recalculated: ${order.total}`);
        
        // Update status and payment info
        order.status = 'closed';
        order.paymentMethod = paymentMethod;
        order.paymentStatus = 'paid';
        
        // Save order
        await order.save();
        
        // Process cash register if payment is in cash
        let cashRegister = null;
        if (paymentMethod === 'cash') {
          // Try to find the cash register opened by the current operator
          cashRegister = await CashRegister.findOne({
            status: 'open',
            currentOperator: req.user.id
          });
          
          // If not found, use the default cash register
          if (!cashRegister) {
            cashRegister = await CashRegister.findOne({
              status: 'open'
            });
          }
          
          // If a cash register is available, record the transaction
          if (cashRegister) {
            // Record payment as cash register entry
            const transaction = new CashTransaction({
              type: 'deposit',
              amount: order.total,
              cashRegister: cashRegister._id,
              user: req.user.id,
              description: `Pagamento da mesa ${table.number}`,
              previousBalance: cashRegister.currentBalance,
              newBalance: cashRegister.currentBalance + order.total,
              order: order._id
            });
            
            await transaction.save();
            
            // Update cash register balance
            cashRegister.currentBalance += order.total;
            cashRegister.expectedBalance += order.total;
            
            await cashRegister.save();
            
            console.log(`Cash transaction recorded: ${transaction._id}, amount: ${order.total}`);
          } else {
            console.log('No open cash register found for cash payment');
          }
        }
      }
    }
    
    // Free table
    table.status = 'free';
    table.openTime = null;
    table.occupants = 0;
    table.waiter = null;
    table.currentOrder = null;
    
    await table.save();
    
    // Emit events
    const socketEvents = req.app.get('socketEvents');
    if (socketEvents) {
      // Emit in specific order with guaranteed delivery
      if (order) {
        console.log(`Emitting orderUpdate event for order ${order._id}`);
        socketEvents.emitOrderUpdate(order._id, table._id, 'closed');
      }
      
      console.log(`Emitting tableUpdate event for table ${table._id}`);
      socketEvents.emitTableUpdate(table._id);
      
      // Add small delay before data update to ensure other events process first
      setTimeout(() => {
        console.log('Emitting dataUpdate event');
        socketEvents.emitDataUpdate();
      }, 100);
    }
    
    res.json({
      success: true,
      table,
      order
    });
  } catch (error) {
    console.error('Error closing table:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message
    });
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