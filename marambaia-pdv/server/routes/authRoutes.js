// routes/authRoutes.js (atualizado)
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

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
router.get('/validate', protect, authController.validateToken);

// Cadastrar usuário (apenas admin)
router.post('/register', protect, checkAdminRole, authController.register);

// Listar usuários (apenas admin)
router.get('/users', protect, checkAdminRole, authController.listUsers);

// Obter usuário por ID
router.get('/users/:id', protect, checkAdminRole, authController.getUser);

// Atualizar usuário
router.put('/users/:id', protect, checkAdminRole, authController.updateUser);

// Alternar status do usuário (ativar/desativar)
router.patch('/users/:id/status', protect, checkAdminRole, authController.toggleUserStatus);

// Redefinir senha de usuário
router.post('/users/:id/reset-password', protect, checkAdminRole, authController.resetPassword);

module.exports = router;