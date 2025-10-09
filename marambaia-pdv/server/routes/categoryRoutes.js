// routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
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

// Listar todas as categorias
router.get('/', protect, categoryController.listCategories);

// Obter categoria por ID
router.get('/:id', protect, categoryController.getCategory);

// Criar categoria
router.post('/', protect, checkManagerRole, categoryController.createCategory);

// Atualizar categoria
router.put('/:id', protect, checkManagerRole, categoryController.updateCategory);

// Excluir categoria (desativar)
router.delete('/:id', protect, checkManagerRole, categoryController.deleteCategory);

module.exports = router;