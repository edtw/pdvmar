// routes/cashRegisterRoutes.js
const express = require('express');
const router = express.Router();
const cashRegisterController = require('../controllers/cashRegisterController');
const auth = require('../middlewares/auth');

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
router.get('/', auth, cashRegisterController.listCashRegisters);

// Obter caixa por ID
router.get('/:id', auth, cashRegisterController.getCashRegister);

// Criar novo caixa
router.post('/', auth, checkManagerRole, cashRegisterController.createCashRegister);

// Abrir caixa
router.post('/:id/open', auth, cashRegisterController.openCashRegister);

// Fechar caixa
router.post('/:id/close', auth, cashRegisterController.closeCashRegister);

// Adicionar dinheiro ao caixa
router.post('/:id/deposit', auth, cashRegisterController.addCash);

// Retirar dinheiro do caixa
router.post('/:id/withdraw', auth, cashRegisterController.withdrawCash);

// Realizar sangria
router.post('/:id/drain', auth, cashRegisterController.drainCash);

// Listar transações do caixa
router.get('/:id/transactions', auth, cashRegisterController.listTransactions);

// Obter relatório do caixa
router.get('/:id/report', auth, cashRegisterController.getCashReport);

module.exports = router;