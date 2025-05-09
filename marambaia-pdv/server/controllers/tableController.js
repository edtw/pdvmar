// controllers/tableController.js
const mongoose = require('mongoose');
const Table = mongoose.model('Table');
const Order = mongoose.model('Order');

/**
 * Listar todas as mesas
 */
exports.listTables = async (req, res) => {
  try {
    // Filtrar por garçom se for um garçom
    const filter = req.user.role === 'waiter' ? { waiter: req.user.id } : {};
    
    const tables = await Table.find(filter)
      .populate('waiter', 'name')
      .populate('currentOrder');
    
    res.json({ success: true, tables });
  } catch (error) {
    console.error('Erro ao listar mesas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};

/**
 * Obter uma mesa por ID
 */
exports.getTable = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id)
      .populate('waiter', 'name')
      .populate('currentOrder');
    
    if (!table) {
      return res.status(404).json({ 
        success: false, 
        message: 'Mesa não encontrada' 
      });
    }
    
    res.json({ success: true, table });
  } catch (error) {
    console.error('Erro ao buscar mesa:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};

/**
 * Criar nova mesa
 */
exports.createTable = async (req, res) => {
  try {
    // Apenas admin e gerente podem criar mesas
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ 
        success: false, 
        message: 'Não autorizado' 
      });
    }
    
    const { number, position, section } = req.body;
    
    // Validar dados
    if (!number) {
      return res.status(400).json({ 
        success: false, 
        message: 'Número da mesa é obrigatório' 
      });
    }
    
    // Verificar se mesa já existe
    const existingTable = await Table.findOne({ number });
    if (existingTable) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mesa já existe' 
      });
    }
    
    // Criar mesa
    const table = new Table({
      number,
      position: position || { x: 0, y: 0 },
      section: section || 'main'
    });
    
    await table.save();
    
    // Emitir evento de atualização
    const socketEvents = req.app.get('socketEvents');
    if (socketEvents) {
      socketEvents.emitTableUpdate(table._id);
    }
    
    res.status(201).json({
      success: true,
      table
    });
  } catch (error) {
    console.error('Erro ao criar mesa:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};

/**
 * Excluir mesa
 */
exports.deleteTable = async (req, res) => {
  try {
    // Apenas admin e gerente podem excluir mesas
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ 
        success: false, 
        message: 'Não autorizado' 
      });
    }
    
    const { id } = req.params;
    
    // Verificar se a mesa existe
    const table = await Table.findById(id);
    if (!table) {
      return res.status(404).json({ 
        success: false, 
        message: 'Mesa não encontrada' 
      });
    }
    
    // Verificar se a mesa está livre
    if (table.status !== 'free') {
      return res.status(400).json({ 
        success: false, 
        message: 'Não é possível excluir uma mesa ocupada' 
      });
    }
    
    // Verificar se há pedidos associados à mesa
    const hasOrders = await Order.exists({ table: id });
    if (hasOrders) {
      return res.status(400).json({ 
        success: false, 
        message: 'Não é possível excluir uma mesa com histórico de pedidos. Considere inativá-la.' 
      });
    }
    
    // Excluir mesa
    await Table.findByIdAndDelete(id);
    
    // Emitir evento de atualização
    const socketEvents = req.app.get('socketEvents');
    if (socketEvents) {
      socketEvents.emitTableUpdate(id);
    }
    
    res.json({
      success: true,
      message: 'Mesa excluída com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir mesa:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};

/**
 * Abrir mesa
 */
exports.openTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { occupants } = req.body;
    
    // Buscar mesa
    const table = await Table.findById(id);
    if (!table) {
      return res.status(404).json({ 
        success: false, 
        message: 'Mesa não encontrada' 
      });
    }
    
    // Verificar se mesa já está ocupada
    if (table.status !== 'free') {
      return res.status(400).json({ 
        success: false, 
        message: 'Mesa já está ocupada' 
      });
    }
    
    // Atualizar mesa
    table.status = 'occupied';
    table.openTime = new Date();
    table.occupants = occupants || 1;
    table.waiter = req.user.id;
    
    await table.save();
    
    // Criar ordem para a mesa
    const order = new Order({
      table: table._id,
      waiter: req.user.id,
      items: []
    });
    
    await order.save();
    
    // Atualizar mesa com a ordem atual
    table.currentOrder = order._id;
    await table.save();
    
    // Emitir evento de atualização
    const socketEvents = req.app.get('socketEvents');
    if (socketEvents) {
      socketEvents.emitTableUpdate(table._id);
    }
    
    res.json({
      success: true,
      table,
      order
    });
  } catch (error) {
    console.error('Erro ao abrir mesa:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};

/**
 * Transferir mesa
 */
exports.transferTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { targetTableId } = req.body;
    
    // Validar dados
    if (!targetTableId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mesa de destino é obrigatória' 
      });
    }
    
    // Buscar mesas
    const sourceTable = await Table.findById(id);
    const targetTable = await Table.findById(targetTableId);
    
    if (!sourceTable || !targetTable) {
      return res.status(404).json({ 
        success: false, 
        message: 'Mesa não encontrada' 
      });
    }
    
    // Verificar se a mesa de origem está ocupada
    if (sourceTable.status !== 'occupied') {
      return res.status(400).json({ 
        success: false, 
        message: 'Mesa de origem não está ocupada' 
      });
    }
    
    // Verificar se a mesa de destino está livre
    if (targetTable.status !== 'free') {
      return res.status(400).json({ 
        success: false, 
        message: 'Mesa de destino já está ocupada' 
      });
    }
    
    // Transferir dados
    targetTable.status = 'occupied';
    targetTable.openTime = sourceTable.openTime;
    targetTable.occupants = sourceTable.occupants;
    targetTable.waiter = sourceTable.waiter;
    targetTable.currentOrder = sourceTable.currentOrder;
    
    // Liberar mesa de origem
    sourceTable.status = 'free';
    sourceTable.openTime = null;
    sourceTable.occupants = 0;
    sourceTable.waiter = null;
    sourceTable.currentOrder = null;
    
    // Atualizar pedido
    if (targetTable.currentOrder) {
      await Order.findByIdAndUpdate(targetTable.currentOrder, { table: targetTable._id });
    }
    
    // Salvar alterações
    await Promise.all([sourceTable.save(), targetTable.save()]);
    
    // Emitir eventos de atualização
    const socketEvents = req.app.get('socketEvents');
    if (socketEvents) {
      socketEvents.emitTableUpdate(sourceTable._id);
      socketEvents.emitTableUpdate(targetTable._id);
    }
    
    res.json({
      success: true,
      sourceTable,
      targetTable
    });
  } catch (error) {
    console.error('Erro ao transferir mesa:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};

/**
 * Fechar mesa
 */
exports.closeTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body;
    
    // Validar dados
    if (!paymentMethod) {
      return res.status(400).json({ 
        success: false, 
        message: 'Método de pagamento é obrigatório' 
      });
    }
    
    // Buscar mesa
    const table = await Table.findById(id);
    if (!table) {
      return res.status(404).json({ 
        success: false, 
        message: 'Mesa não encontrada' 
      });
    }
    
    // Verificar se mesa está ocupada
    if (table.status !== 'occupied' && table.status !== 'waiting_payment') {
      return res.status(400).json({ 
        success: false, 
        message: 'Mesa não está ocupada' 
      });
    }
    
    // Buscar e fechar pedido
    if (table.currentOrder) {
      const order = await Order.findById(table.currentOrder);
      if (order) {
        order.status = 'closed';
        order.paymentMethod = paymentMethod;
        order.paymentStatus = 'paid';
        await order.save();
      }
    }
    
    // Liberar mesa
    table.status = 'free';
    table.openTime = null;
    table.occupants = 0;
    table.waiter = null;
    table.currentOrder = null;
    
    await table.save();
    
    // Emitir evento de atualização
    const socketEvents = req.app.get('socketEvents');
    if (socketEvents) {
      socketEvents.emitTableUpdate(table._id);
    }
    
    res.json({
      success: true,
      table
    });
  } catch (error) {
    console.error('Erro ao fechar mesa:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};

/**
 * Atualizar posição da mesa
 */
exports.updateTablePosition = async (req, res) => {
  try {
    // Apenas admin e gerente podem atualizar posições
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ 
        success: false, 
        message: 'Não autorizado' 
      });
    }
    
    const { id } = req.params;
    const { x, y } = req.body;
    
    // Validar dados
    if (x === undefined || y === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Posição (x, y) é obrigatória' 
      });
    }
    
    // Atualizar mesa
    const table = await Table.findByIdAndUpdate(
      id,
      { position: { x, y } },
      { new: true }
    );
    
    if (!table) {
      return res.status(404).json({ 
        success: false, 
        message: 'Mesa não encontrada' 
      });
    }
    
    // Emitir evento de atualização
    const socketEvents = req.app.get('socketEvents');
    if (socketEvents) {
      socketEvents.emitTableUpdate(table._id);
    }
    
    res.json({
      success: true,
      table
    });
  } catch (error) {
    console.error('Erro ao atualizar posição da mesa:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};