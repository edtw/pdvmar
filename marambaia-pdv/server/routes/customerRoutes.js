// routes/customerRoutes.js
const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const Category = require('../models/Category');
const { verifyTableAccess } = require('../middlewares/orderAccess');
const { verifyCpfForOrder, verifyCpfForGetOrder } = require('../middlewares/verifyCpf');

// All routes are public (no authentication required for customers)
// But CPF is required for security on all order operations

// Get available products (public)
router.get('/products', customerController.getProducts);

// Get product categories (public)
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find({ active: true }).sort({ name: 1 });
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Erro ao buscar categorias:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar categorias',
      error: error.message
    });
  }
});

// Create customer command - with table access verification
router.post('/commands', verifyTableAccess, customerController.createCommand);

// Get customer order - REQUIRES CPF verification
router.get('/orders/:orderId', verifyCpfForGetOrder, customerController.getOrder);

// Add item to order - REQUIRES CPF verification
router.post('/orders/:orderId/items', verifyCpfForOrder, customerController.addItem);

// Remove item from order - REQUIRES CPF verification
router.delete('/orders/:orderId/items/:itemId', verifyCpfForOrder, customerController.removeItem);

// Request bill - REQUIRES CPF verification
router.post('/orders/:orderId/request-bill', verifyCpfForOrder, customerController.requestBill);

// Call waiter - REQUIRES CPF verification
router.post('/orders/:orderId/call-waiter', verifyCpfForOrder, customerController.callWaiter);

module.exports = router;
