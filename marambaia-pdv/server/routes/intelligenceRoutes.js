// routes/intelligenceRoutes.js
// Rotas para algoritmos inteligentes

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middlewares/auth');
const algorithms = require('../services/smartAlgorithms');

/**
 * @route   GET /api/intelligence/recommendations/:customerId
 * @desc    Get product recommendations for customer
 * @access  Public (customer can see their own)
 */
router.get('/recommendations/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const limit = parseInt(req.query.limit) || 5;

    const recommendations = await algorithms.getProductRecommendations(customerId, limit);

    res.json({
      success: true,
      recommendations
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar recomendações',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/intelligence/upsell/:orderId
 * @desc    Get upsell suggestions for an order
 * @access  Public
 */
router.get('/upsell/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const suggestions = await algorithms.getUpsellSuggestions(orderId);

    res.json({
      success: true,
      suggestions
    });
  } catch (error) {
    console.error('Error getting upsell suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar sugestões',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/intelligence/forgotten-tables
 * @desc    Detect forgotten tables
 * @access  Protected (staff only)
 */
router.get('/forgotten-tables', protect, authorize('admin', 'manager', 'waiter'), async (req, res) => {
  try {
    const forgotten = await algorithms.detectForgottenTables();

    res.json({
      success: true,
      tables: forgotten,
      count: forgotten.length
    });
  } catch (error) {
    console.error('Error detecting forgotten tables:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao detectar mesas esquecidas',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/intelligence/fraud-check/:orderId
 * @desc    Check if order is potentially fraudulent
 * @access  Protected (staff only)
 */
router.get('/fraud-check/:orderId', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { orderId } = req.params;

    const fraudAnalysis = await algorithms.detectFraudulentOrder(orderId);

    res.json({
      success: true,
      ...fraudAnalysis
    });
  } catch (error) {
    console.error('Error checking fraud:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao analisar fraude',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/intelligence/menu-analysis
 * @desc    Get menu performance analysis
 * @access  Protected (admin/manager only)
 */
router.get('/menu-analysis', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const analysis = await algorithms.analyzeMenuPerformance();

    res.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error('Error analyzing menu:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao analisar cardápio',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/intelligence/demand-forecast
 * @desc    Predict demand for specific date/time
 * @access  Protected (admin/manager only)
 */
router.get('/demand-forecast', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Data é obrigatória'
      });
    }

    const forecast = await algorithms.predictDemand(date);

    res.json({
      success: true,
      forecast
    });
  } catch (error) {
    console.error('Error forecasting demand:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao prever demanda',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/intelligence/suggest-waiter/:tableId
 * @desc    Suggest best waiter for a table
 * @access  Protected (admin/manager only)
 */
router.get('/suggest-waiter/:tableId', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { tableId } = req.params;

    const waiter = await algorithms.suggestWaiterForTable(tableId);

    res.json({
      success: true,
      suggestedWaiter: waiter
    });
  } catch (error) {
    console.error('Error suggesting waiter:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao sugerir garçom',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/intelligence/customer-insights/:customerId
 * @desc    Get customer insights and profile
 * @access  Protected (admin/manager only)
 */
router.get('/customer-insights/:customerId', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const Customer = mongoose.model('Customer');

    const customer = await Customer.findById(req.params.customerId)
      .populate('consumptionProfile.favoriteProducts.product')
      .populate('consumptionProfile.favoriteCategories.category');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Cliente não encontrado'
      });
    }

    // Get recommendations
    const recommendations = await customer.getRecommendations(5);

    res.json({
      success: true,
      customer: {
        name: customer.name,
        cpf: customer.cpf,
        visitCount: customer.visitCount,
        lastVisit: customer.lastVisit,
        loyaltyProgram: customer.loyaltyProgram,
        consumptionProfile: customer.consumptionProfile,
        tags: customer.tags,
        riskAnalysis: customer.riskAnalysis
      },
      recommendations
    });
  } catch (error) {
    console.error('Error getting customer insights:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar insights do cliente',
      error: error.message
    });
  }
});

module.exports = router;
