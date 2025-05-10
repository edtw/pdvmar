// controllers/cashRegisterController.js
const mongoose = require('mongoose');
const CashRegister = mongoose.model('CashRegister');
const CashTransaction = mongoose.model('CashTransaction');
const Order = mongoose.model('Order');

/**
 * Lista todos os caixas
 */
exports.listCashRegisters = async (req, res) => {
  try {
    // Limitar acesso baseado no papel do usuário
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ 
        success: false, 
        message: 'Acesso negado. Apenas administradores e gerentes podem listar todos os caixas' 
      });
    }
    
    const cashRegisters = await CashRegister.find()
      .populate('currentOperator', 'name username');
    
    res.json({ success: true, cashRegisters });
  } catch (error) {
    console.error('Erro ao listar caixas:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};

/**
 * Obter detalhes de um caixa específico
 */
exports.getCashRegister = async (req, res) => {
  try {
    const cashRegister = await CashRegister.findById(req.params.id)
      .populate('currentOperator', 'name username');
    
    if (!cashRegister) {
      return res.status(404).json({ 
        success: false, 
        message: 'Caixa não encontrado' 
      });
    }
    
    res.json({ success: true, cashRegister });
  } catch (error) {
    console.error('Erro ao buscar caixa:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};

/**
 * Criar um novo caixa
 */
exports.createCashRegister = async (req, res) => {
  try {
    // Verificar permissões
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ 
        success: false, 
        message: 'Acesso negado. Apenas administradores e gerentes podem criar caixas' 
      });
    }
    
    const { identifier } = req.body;
    
    // Validar dados
    if (!identifier) {
      return res.status(400).json({ 
        success: false, 
        message: 'Identificador do caixa é obrigatório' 
      });
    }
    
    // Verificar se já existe caixa com mesmo identificador
    const existingCashRegister = await CashRegister.findOne({ identifier });
    if (existingCashRegister) {
      return res.status(400).json({ 
        success: false, 
        message: 'Já existe um caixa com este identificador' 
      });
    }
    
    // Criar caixa
    const cashRegister = new CashRegister({
      identifier,
      currentBalance: 0,
      status: 'closed'
    });
    
    await cashRegister.save();
    
    res.status(201).json({
      success: true,
      cashRegister
    });
  } catch (error) {
    console.error('Erro ao criar caixa:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};

/**
 * Abrir caixa - SEM TRANSAÇÕES
 */
exports.openCashRegister = async (req, res) => {
  try {
    const { id } = req.params;
    const { openingBalance } = req.body;
    
    // Validações
    if (openingBalance === undefined || openingBalance < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valor de abertura inválido' 
      });
    }
    
    // Buscar caixa
    const cashRegister = await CashRegister.findById(id);
    
    if (!cashRegister) {
      return res.status(404).json({ 
        success: false, 
        message: 'Caixa não encontrado' 
      });
    }
    
    // Verificar se caixa já está aberto
    if (cashRegister.status === 'open') {
      return res.status(400).json({ 
        success: false, 
        message: 'Caixa já está aberto' 
      });
    }
    
    // Atualizar caixa
    cashRegister.status = 'open';
    cashRegister.currentOperator = req.user.id;
    cashRegister.openedAt = new Date();
    cashRegister.openingBalance = openingBalance;
    cashRegister.currentBalance = openingBalance;
    cashRegister.expectedBalance = openingBalance;
    
    await cashRegister.save();
    
    // Registrar transação de abertura
    const transaction = new CashTransaction({
      type: 'open',
      amount: openingBalance,
      cashRegister: cashRegister._id,
      user: req.user.id,
      description: 'Abertura de caixa',
      previousBalance: 0,
      newBalance: openingBalance
    });
    
    await transaction.save();
    
    // Emitir evento de atualização
    const socketEvents = req.app.get('socketEvents');
    if (socketEvents) {
      socketEvents.emitDataUpdate();
      socketEvents.emitCashRegisterUpdate(cashRegister._id);
    }
    
    // Popular campo
    await cashRegister.populate('currentOperator', 'name username');
    
    res.json({
      success: true,
      cashRegister,
      transaction
    });
  } catch (error) {
    console.error('Erro ao abrir caixa:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};

/**
 * Fechar caixa - SEM TRANSAÇÕES
 */
exports.closeCashRegister = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      closingBalance, 
      paymentDetails,
      cashCount
    } = req.body;
    
    // Validações
    if (closingBalance === undefined || closingBalance < 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valor de fechamento inválido' 
      });
    }
    
    // Buscar caixa
    const cashRegister = await CashRegister.findById(id);
    
    if (!cashRegister) {
      return res.status(404).json({ 
        success: false, 
        message: 'Caixa não encontrado' 
      });
    }
    
    // Verificar se caixa está aberto
    if (cashRegister.status !== 'open') {
      return res.status(400).json({ 
        success: false, 
        message: 'Caixa não está aberto' 
      });
    }
    
    // Verificar se o usuário é o operador atual do caixa ou um admin/gerente
    if (
      cashRegister.currentOperator.toString() !== req.user.id &&
      req.user.role !== 'admin' &&
      req.user.role !== 'manager'
    ) {
      return res.status(403).json({ 
        success: false, 
        message: 'Apenas o operador atual, administradores ou gerentes podem fechar o caixa' 
      });
    }
    
    // Calcular diferença entre valor esperado e contagem física
    const balanceDifference = closingBalance - cashRegister.expectedBalance;
    
    // Atualizar caixa
    cashRegister.status = 'closed';
    cashRegister.closedAt = new Date();
    cashRegister.closingBalance = closingBalance;
    cashRegister.balanceDifference = balanceDifference;
    cashRegister.currentOperator = null;
    
    await cashRegister.save();
    
    // Registrar transação de fechamento
    const transaction = new CashTransaction({
      type: 'close',
      amount: closingBalance,
      cashRegister: cashRegister._id,
      user: req.user.id,
      description: `Fechamento de caixa. Diferença: ${balanceDifference.toFixed(2)}`,
      previousBalance: cashRegister.expectedBalance,
      newBalance: 0,
      paymentDetails: paymentDetails || {
        cash: closingBalance,
        credit: 0,
        debit: 0,
        pix: 0,
        other: 0
      },
      cashCount: cashCount || {}
    });
    
    await transaction.save();
    
    // Emitir evento de atualização
    const socketEvents = req.app.get('socketEvents');
    if (socketEvents) {
      socketEvents.emitDataUpdate();
      socketEvents.emitCashRegisterUpdate(cashRegister._id);
    }
    
    res.json({
      success: true,
      cashRegister,
      transaction,
      balanceDifference
    });
  } catch (error) {
    console.error('Erro ao fechar caixa:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};

/**
 * Adicionar dinheiro ao caixa - SEM TRANSAÇÕES
 */
exports.addCash = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, description, destination } = req.body;
    
    // Validações
    if (amount === undefined || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valor inválido' 
      });
    }
    
    // Buscar caixa
    const cashRegister = await CashRegister.findById(id);
    
    if (!cashRegister) {
      return res.status(404).json({ 
        success: false, 
        message: 'Caixa não encontrado' 
      });
    }
    
    // Verificar se caixa está aberto
    if (cashRegister.status !== 'open') {
      return res.status(400).json({ 
        success: false, 
        message: 'Caixa não está aberto' 
      });
    }
    
    // Atualizar valores
    const previousBalance = cashRegister.currentBalance;
    const newBalance = previousBalance + amount;
    
    cashRegister.currentBalance = newBalance;
    cashRegister.expectedBalance = newBalance;
    
    await cashRegister.save();
    
    // Registrar transação
    const transaction = new CashTransaction({
      type: 'deposit',
      amount,
      cashRegister: cashRegister._id,
      user: req.user.id,
      description: description || 'Adição de dinheiro ao caixa',
      previousBalance,
      newBalance,
      destination
    });
    
    await transaction.save();
    
    // Emitir evento de atualização
    const socketEvents = req.app.get('socketEvents');
    if (socketEvents) {
      socketEvents.emitDataUpdate();
      socketEvents.emitCashRegisterUpdate(cashRegister._id);
    }
    
    res.json({
      success: true,
      cashRegister,
      transaction
    });
  } catch (error) {
    console.error('Erro ao adicionar dinheiro ao caixa:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};

/**
 * Retirar dinheiro do caixa - SEM TRANSAÇÕES
 */
exports.withdrawCash = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, description } = req.body;
    
    // Validações
    if (amount === undefined || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valor inválido' 
      });
    }
    
    // Buscar caixa
    const cashRegister = await CashRegister.findById(id);
    
    if (!cashRegister) {
      return res.status(404).json({ 
        success: false, 
        message: 'Caixa não encontrado' 
      });
    }
    
    // Verificar se caixa está aberto
    if (cashRegister.status !== 'open') {
      return res.status(400).json({ 
        success: false, 
        message: 'Caixa não está aberto' 
      });
    }
    
    // Verificar se há saldo suficiente
    if (cashRegister.currentBalance < amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Saldo insuficiente no caixa' 
      });
    }
    
    // Atualizar valores
    const previousBalance = cashRegister.currentBalance;
    const newBalance = previousBalance - amount;
    
    cashRegister.currentBalance = newBalance;
    cashRegister.expectedBalance = newBalance;
    
    await cashRegister.save();
    
    // Registrar transação
    const transaction = new CashTransaction({
      type: 'withdraw',
      amount,
      cashRegister: cashRegister._id,
      user: req.user.id,
      description: description || 'Retirada de dinheiro do caixa',
      previousBalance,
      newBalance
    });
    
    await transaction.save();
    
    // Emitir evento de atualização
    const socketEvents = req.app.get('socketEvents');
    if (socketEvents) {
      socketEvents.emitDataUpdate();
      socketEvents.emitCashRegisterUpdate(cashRegister._id);
    }
    
    res.json({
      success: true,
      cashRegister,
      transaction
    });
  } catch (error) {
    console.error('Erro ao retirar dinheiro do caixa:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};

/**
 * Realizar sangria do caixa - SEM TRANSAÇÕES
 */
exports.drainCash = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, destination } = req.body;
    
    // Validações
    if (amount === undefined || amount <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valor inválido' 
      });
    }
    
    if (!destination) {
      return res.status(400).json({ 
        success: false, 
        message: 'Destino da sangria é obrigatório' 
      });
    }
    
    // Buscar caixa
    const cashRegister = await CashRegister.findById(id);
    
    if (!cashRegister) {
      return res.status(404).json({ 
        success: false, 
        message: 'Caixa não encontrado' 
      });
    }
    
    // Verificar se caixa está aberto
    if (cashRegister.status !== 'open') {
      return res.status(400).json({ 
        success: false, 
        message: 'Caixa não está aberto' 
      });
    }
    
    // Verificar se há saldo suficiente
    if (cashRegister.currentBalance < amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'Saldo insuficiente no caixa' 
      });
    }
    
    // Atualizar valores
    const previousBalance = cashRegister.currentBalance;
    const newBalance = previousBalance - amount;
    
    cashRegister.currentBalance = newBalance;
    cashRegister.expectedBalance = newBalance;
    
    await cashRegister.save();
    
    // Registrar transação
    const transaction = new CashTransaction({
      type: 'drain',
      amount,
      cashRegister: cashRegister._id,
      user: req.user.id,
      description: `Sangria de caixa para ${destination}`,
      previousBalance,
      newBalance,
      destination
    });
    
    await transaction.save();
    
    // Emitir evento de atualização
    const socketEvents = req.app.get('socketEvents');
    if (socketEvents) {
      socketEvents.emitDataUpdate();
      socketEvents.emitCashRegisterUpdate(cashRegister._id);
    }
    
    res.json({
      success: true,
      cashRegister,
      transaction
    });
  } catch (error) {
    console.error('Erro ao realizar sangria do caixa:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};

/**
 * Listar transações de um caixa
 */
exports.listTransactions = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, type } = req.query;
    
    // Construir filtro
    const filter = { cashRegister: id };
    
    // Filtros de data
    if (startDate || endDate) {
      filter.createdAt = {};
      
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      
      if (endDate) {
        // Ajustar para o final do dia
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = endDateTime;
      }
    }
    
    // Filtrar por tipo
    if (type) {
      filter.type = type;
    }
    
    // Buscar transações
    const transactions = await CashTransaction.find(filter)
      .populate('user', 'name username')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      transactions
    });
  } catch (error) {
    console.error('Erro ao listar transações do caixa:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};

/**
 * Obter relatório de movimentações do caixa
 */
exports.getCashReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    
    // Validar datas
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Datas de início e fim são obrigatórias' 
      });
    }
    
    // Ajustar para o início e final do dia
    const startDateTime = new Date(startDate);
    startDateTime.setHours(0, 0, 0, 0);
    
    const endDateTime = new Date(endDate);
    endDateTime.setHours(23, 59, 59, 999);
    
    // Buscar transações
    const transactions = await CashTransaction.find({
      cashRegister: id,
      createdAt: { $gte: startDateTime, $lte: endDateTime }
    }).sort({ createdAt: 1 });
    
    // Calcular totais
    const totals = {
      openings: 0,
      closings: 0,
      deposits: 0,
      withdraws: 0,
      drains: 0
    };
    
    transactions.forEach(transaction => {
      switch (transaction.type) {
        case 'open':
          totals.openings += transaction.amount;
          break;
        case 'close':
          totals.closings += transaction.amount;
          break;
        case 'deposit':
          totals.deposits += transaction.amount;
          break;
        case 'withdraw':
          totals.withdraws += transaction.amount;
          break;
        case 'drain':
          totals.drains += transaction.amount;
          break;
      }
    });
    
    // Resultado final
    res.json({
      success: true,
      report: {
        startDate: startDateTime,
        endDate: endDateTime,
        transactions,
        totals
      }
    });
  } catch (error) {
    console.error('Erro ao gerar relatório do caixa:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};