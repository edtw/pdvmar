// routes/reportRoutes.js (CORRIGIDO)
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
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

// Relatório de vendas do período
router.get('/sales', protect, checkManagerRole, reportController.salesReport);

// Relatório de produtos mais vendidos
router.get('/top-products', protect, checkManagerRole, reportController.topProductsReport);

// Relatório de vendas diárias
router.get('/daily-sales', protect, checkManagerRole, reportController.dailySalesReport);

// Relatório de desempenho dos garçons
router.get('/waiter-performance', protect, checkManagerRole, reportController.waiterPerformanceReport);

module.exports = router;