// routes/tableRoutes.js
const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');
const { protect } = require('../middlewares/auth');

// Middleware para verificar permissões de admin/gerente
const checkManagerRole = (req, res, next) => {
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({ 
      success: false, 
      message: 'Acesso negado. Apenas administradores e gerentes podem executar esta ação.' 
    });
  }
  next();
};

// Listar todas as mesas
router.get('/', protect, tableController.listTables);

// Obter mesa por ID
router.get('/:id', protect, tableController.getTable);

// Criar mesa
router.post('/', protect, checkManagerRole, tableController.createTable);

// Excluir mesa
router.delete('/:id', protect, checkManagerRole, tableController.deleteTable);

// Abrir mesa
router.post('/:id/open', protect, tableController.openTable);

// Transferir mesa
router.post('/:id/transfer', protect, tableController.transferTable);

// Fechar mesa
router.post('/:id/close', protect, tableController.closeTable);

// Atualizar posição da mesa
router.put('/:id/position', protect, checkManagerRole, tableController.updateTablePosition);

// Atribuir garçom à mesa
router.patch('/:id/assign-waiter', protect, checkManagerRole, tableController.assignWaiter);

module.exports = router;