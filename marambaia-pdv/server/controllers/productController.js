// controllers/productController.js
const mongoose = require('mongoose');
const Product = mongoose.model('Product');
const Category = mongoose.model('Category');
const OrderItem = mongoose.model('OrderItem');

/**
 * Listar todos os produtos
 */
exports.listProducts = async (req, res) => {
  try {
    // Parâmetros de filtragem
    const { category, available, featured, search } = req.query;
    
    // Construir filtro
    const filter = {};
    
    if (category) {
      filter.category = category;
    }
    
    if (available === 'true') {
      filter.available = true;
    } else if (available === 'false') {
      filter.available = false;
    }
    
    if (featured === 'true') {
      filter.featured = true;
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Executar consulta
    const products = await Product.find(filter)
      .populate('category', 'name')
      .sort({ name: 1 });
    
    res.json({ success: true, products });
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};

/**
 * Obter produto por ID
 */
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name');
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Produto não encontrado' 
      });
    }
    
    res.json({ success: true, product });
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};

/**
 * Criar produto
 */
exports.createProduct = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      price, 
      category,
      image,
      available,
      featured,
      preparationTime
    } = req.body;
    
    // Validação básica
    if (!name || !price || !category) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nome, preço e categoria são obrigatórios' 
      });
    }
    
    // Verificar se categoria existe
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'Categoria não encontrada' 
      });
    }
    
    // Criar produto
    const product = new Product({
      name,
      description,
      price,
      category,
      image,
      available: available !== undefined ? available : true,
      featured: featured || false,
      preparationTime: preparationTime || 10
    });
    
    await product.save();
    
    // Popular categoria
    await product.populate('category', 'name');
    
    res.status(201).json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};

/**
 * Atualizar produto
 */
exports.updateProduct = async (req, res) => {
  try {
    const { 
      name, 
      description, 
      price, 
      category,
      image,
      available,
      featured,
      preparationTime
    } = req.body;
    
    // Validação básica
    if (!name || !price || !category) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nome, preço e categoria são obrigatórios' 
      });
    }
    
    // Verificar se categoria existe
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ 
        success: false, 
        message: 'Categoria não encontrada' 
      });
    }
    
    // Atualizar produto
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        price,
        category,
        image,
        available,
        featured,
        preparationTime
      },
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Produto não encontrado' 
      });
    }
    
    // Popular categoria
    await product.populate('category', 'name');
    
    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};

/**
 * Atualizar disponibilidade do produto
 */
exports.updateAvailability = async (req, res) => {
  try {
    const { available } = req.body;
    
    if (available === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Disponibilidade é obrigatória' 
      });
    }
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { available },
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Produto não encontrado' 
      });
    }
    
    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Erro ao atualizar disponibilidade:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};

/**
 * Excluir produto
 */
exports.deleteProduct = async (req, res) => {
  try {
    // Verificar se produto está em pedidos abertos
    const usedInOrders = await OrderItem.exists({
      product: req.params.id,
      status: { $nin: ['delivered', 'canceled'] }
    });
    
    if (usedInOrders) {
      return res.status(400).json({ 
        success: false, 
        message: 'Não é possível excluir o produto pois está em uso em pedidos em andamento' 
      });
    }
    
    // Excluir produto (hard delete ou soft delete)
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { available: false },  // Soft delete
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Produto não encontrado' 
      });
    }
    
    res.json({
      success: true,
      message: 'Produto desativado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};

/**
 * Listar produtos por categoria
 */
exports.listProductsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    const products = await Product.find({ 
      category: categoryId,
      available: true 
    }).sort({ name: 1 });
    
    res.json({ success: true, products });
  } catch (error) {
    console.error('Erro ao listar produtos por categoria:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};