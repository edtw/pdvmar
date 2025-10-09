const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middlewares/auth');

// Listar usuários (com filtros opcionais)
router.get('/', protect, userController.listUsers);

// Obter detalhes de um usuário
router.get('/:id', protect, userController.getUser);

module.exports = router; 