// routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
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

// Relatório de vendas do período
router.get('/sales', auth, checkManagerRole, reportController.salesReport);

// Relatório de produtos mais vendidos
router.get('/top-products', auth, checkManagerRole, reportController.topProductsReport);

// Relatório de vendas diárias
router.get('/daily-sales', auth, checkManagerRole, reportController.dailySalesReport);

// Relatório de desempenho dos garçons
router.get('/waiter-performance', auth, checkManagerRole, reportController.waiterPerformanceReport);

module.exports = router;