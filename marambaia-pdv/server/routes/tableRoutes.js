// routes/tableRoutes.js
const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');
const auth = require('../middlewares/auth');

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
router.get('/', auth, tableController.listTables);

// Obter mesa por ID
router.get('/:id', auth, tableController.getTable);

// Criar mesa
router.post('/', auth, checkManagerRole, tableController.createTable);

// Excluir mesa
router.delete('/:id', auth, checkManagerRole, tableController.deleteTable);

// Abrir mesa
router.post('/:id/open', auth, tableController.openTable);

// Transferir mesa
router.post('/:id/transfer', auth, tableController.transferTable);

// Fechar mesa
router.post('/:id/close', auth, tableController.closeTable);

// Atualizar posição da mesa
router.put('/:id/position', auth, checkManagerRole, tableController.updateTablePosition);

module.exports = router;