// routes/backupRoutes.js
const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');
const auth = require('../middlewares/auth');

// Middleware para verificar permissões de admin
const checkAdminRole = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Acesso negado. Apenas administradores podem executar esta ação.' 
    });
  }
  next();
};

// Criar backup
router.post('/', auth, checkAdminRole, backupController.createBackup);

// Listar backups
router.get('/', auth, checkAdminRole, backupController.listBackups);

// Restaurar backup
router.post('/:id/restore', auth, checkAdminRole, backupController.restoreBackup);

// Download de backup
router.get('/:id/download', auth, checkAdminRole, backupController.downloadBackup);

// Excluir backup
router.delete('/:id', auth, checkAdminRole, backupController.deleteBackup);

router.post('/sync', auth, checkAdminRole, backupController.syncBackups);

// Verificar integridade de backup específico
router.get('/:id/verify', auth, checkAdminRole, backupController.verifyBackup);

module.exports = router;