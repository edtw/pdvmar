// routes/analyticsRoutes.js
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { protect, authorize } = require('../middlewares/auth');

// Todas as rotas protegidas - apenas admin e manager
router.use(protect);
router.use(authorize('admin', 'manager'));

/**
 * @route   GET /api/analytics/overview
 * @desc    Dashboard principal com métricas gerais
 * @access  Private (Admin, Manager)
 */
router.get('/overview', analyticsController.getOverview);

/**
 * @route   GET /api/analytics/peak-hours
 * @desc    Análise de horários de pico
 * @access  Private (Admin, Manager)
 */
router.get('/peak-hours', analyticsController.getPeakHours);

/**
 * @route   GET /api/analytics/delays
 * @desc    Sistema inteligente de detecção de atrasos
 * @access  Private (Admin, Manager)
 */
router.get('/delays', analyticsController.getDelayAnalysis);

/**
 * @route   GET /api/analytics/products/performance
 * @desc    Análise de performance de produtos
 * @access  Private (Admin, Manager)
 */
router.get('/products/performance', analyticsController.getProductPerformance);

/**
 * @route   GET /api/analytics/revenue-timeline
 * @desc    Timeline de receita (para gráficos)
 * @access  Private (Admin, Manager)
 */
router.get('/revenue-timeline', analyticsController.getRevenueTimeline);

/**
 * @route   GET /api/analytics/customer-insights
 * @desc    Insights sobre clientes
 * @access  Private (Admin, Manager)
 */
router.get('/customer-insights', analyticsController.getCustomerInsights);

module.exports = router;
