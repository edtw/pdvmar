// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect } = require('../middlewares/auth');

// Adicionar item ao pedido
router.post('/:id/items', protect, orderController.addItem);

// Listar itens do pedido
router.get('/:id/items', protect, orderController.listItems);

// Atualizar status do item
router.put('/items/:itemId/status', protect, orderController.updateItemStatus);

// Marcar item como entregue (para garçons)
router.put('/items/:itemId/deliver', protect, orderController.markItemAsDelivered);

// Remover item do pedido
router.delete('/items/:itemId', protect, orderController.removeItem);

module.exports = router;