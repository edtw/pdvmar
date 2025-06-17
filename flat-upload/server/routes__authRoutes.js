// routes/authRoutes.js (atualizado)
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middlewares/auth');

// Middleware para verificar permissões de admin
const checkAdminRole = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({ 
      success: false, 
      message: 'Acesso negado. Apenas administradores e gerentes podem executar esta ação.' 
    });
  }
  next();
};

// Rota de login
router.post('/login', authController.login);

// Validar token
router.get('/validate', auth, authController.validateToken);

// Cadastrar usuário (apenas admin)
router.post('/register', auth, checkAdminRole, authController.register);

// Listar usuários (apenas admin)
router.get('/users', auth, checkAdminRole, authController.listUsers);

// Obter usuário por ID
router.get('/users/:id', auth, checkAdminRole, authController.getUser);

// Atualizar usuário
router.put('/users/:id', auth, checkAdminRole, authController.updateUser);

// Alternar status do usuário (ativar/desativar)
router.patch('/users/:id/status', auth, checkAdminRole, authController.toggleUserStatus);

// Redefinir senha de usuário
router.post('/users/:id/reset-password', auth, checkAdminRole, authController.resetPassword);

module.exports = router;