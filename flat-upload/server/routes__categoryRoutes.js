// routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
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

// Listar todas as categorias
router.get('/', auth, categoryController.listCategories);

// Obter categoria por ID
router.get('/:id', auth, categoryController.getCategory);

// Criar categoria
router.post('/', auth, checkManagerRole, categoryController.createCategory);

// Atualizar categoria
router.put('/:id', auth, checkManagerRole, categoryController.updateCategory);

// Excluir categoria (desativar)
router.delete('/:id', auth, checkManagerRole, categoryController.deleteCategory);

module.exports = router;