// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
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

// Listar todos os produtos
router.get('/', protect, productController.listProducts);

// Obter produto por ID
router.get('/:id', protect, productController.getProduct);

// Criar produto
router.post('/', protect, checkManagerRole, productController.createProduct);

// Atualizar produto
router.put('/:id', protect, checkManagerRole, productController.updateProduct);

// Atualizar disponibilidade do produto
router.patch('/:id/availability', protect, productController.updateAvailability);

// Excluir produto
router.delete('/:id', protect, checkManagerRole, productController.deleteProduct);

// Listar produtos por categoria
router.get('/by-category/:categoryId', protect, productController.listProductsByCategory);

module.exports = router;