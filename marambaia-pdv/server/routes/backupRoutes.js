// routes/backupRoutes.js
const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backupController');
const { protect } = require('../middlewares/auth');

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
router.post('/', protect, checkAdminRole, backupController.createBackup);

// Listar backups
router.get('/', protect, checkAdminRole, backupController.listBackups);

// Restaurar backup
router.post('/:id/restore', protect, checkAdminRole, backupController.restoreBackup);

// Download de backup
router.get('/:id/download', protect, checkAdminRole, backupController.downloadBackup);

// Excluir backup
router.delete('/:id', protect, checkAdminRole, backupController.deleteBackup);

router.post('/sync', protect, checkAdminRole, backupController.syncBackups);

// Verificar integridade de backup específico
router.get('/:id/verify', protect, checkAdminRole, backupController.verifyBackup);

module.exports = router;