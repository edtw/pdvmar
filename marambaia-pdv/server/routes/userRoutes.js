const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middlewares/auth');

// Listar usuários (com filtros opcionais)
router.get('/', auth, userController.listUsers);

// Obter detalhes de um usuário
router.get('/:id', auth, userController.getUser);

module.exports = router; 