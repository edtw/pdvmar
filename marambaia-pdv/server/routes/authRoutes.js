// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middlewares/auth');

// Rota de login
router.post('/login', authController.login);

// Validar token
router.get('/validate', auth, authController.validateToken);

// Cadastrar usuário (apenas admin)
router.post('/register', auth, authController.register);

// Listar usuários (apenas admin)
router.get('/users', auth, authController.listUsers);

module.exports = router;