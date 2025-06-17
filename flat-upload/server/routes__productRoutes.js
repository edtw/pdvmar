// routes/productRoutes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
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

// Listar todos os produtos
router.get('/', auth, productController.listProducts);

// Obter produto por ID
router.get('/:id', auth, productController.getProduct);

// Criar produto
router.post('/', auth, checkManagerRole, productController.createProduct);

// Atualizar produto
router.put('/:id', auth, checkManagerRole, productController.updateProduct);

// Atualizar disponibilidade do produto
router.patch('/:id/availability', auth, productController.updateAvailability);

// Excluir produto
router.delete('/:id', auth, checkManagerRole, productController.deleteProduct);

// Listar produtos por categoria
router.get('/by-category/:categoryId', auth, productController.listProductsByCategory);

module.exports = router;