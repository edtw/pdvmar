// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const auth = require('../middlewares/auth');

// Adicionar item ao pedido
router.post('/:id/items', auth, orderController.addItem);

// Listar itens do pedido
router.get('/:id/items', auth, orderController.listItems);

// Atualizar status do item
router.put('/items/:itemId/status', auth, orderController.updateItemStatus);

// Remover item do pedido
router.delete('/items/:itemId', auth, orderController.removeItem);

module.exports = router;