// routes/cashRegisterRoutes.js
const express = require('express');
const router = express.Router();
const cashRegisterController = require('../controllers/cashRegisterController');
const { protect } = require('../middlewares/auth');

// Middleware para verificar permissões de admin/gerente
const checkManagerRole = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({ 
      success: false, 
      message: 'Acesso negado. Apenas administradores e gerentes podem executar esta ação.' 
    });
  }
  next();
};

// Listar todos os caixas
router.get('/', protect, cashRegisterController.listCashRegisters);

// Obter caixa por ID
router.get('/:id', protect, cashRegisterController.getCashRegister);

// Criar novo caixa
router.post('/', protect, checkManagerRole, cashRegisterController.createCashRegister);

// Abrir caixa
router.post('/:id/open', protect, cashRegisterController.openCashRegister);

// Fechar caixa
router.post('/:id/close', protect, cashRegisterController.closeCashRegister);

// Adicionar dinheiro ao caixa
router.post('/:id/deposit', protect, cashRegisterController.addCash);

// Retirar dinheiro do caixa
router.post('/:id/withdraw', protect, cashRegisterController.withdrawCash);

// Realizar sangria
router.post('/:id/drain', protect, cashRegisterController.drainCash);

// Listar transações do caixa
router.get('/:id/transactions', protect, cashRegisterController.listTransactions);

// Obter relatório do caixa
router.get('/:id/report', protect, cashRegisterController.getCashReport);

module.exports = router;