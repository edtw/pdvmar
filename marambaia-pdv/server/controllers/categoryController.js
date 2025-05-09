// controllers/categoryController.js
const mongoose = require('mongoose');
const Category = mongoose.model('Category');
const Product = mongoose.model('Product');

/**
 * Listar todas as categorias
 */
exports.listCategories = async (req, res) => {
  try {
    const categories = await Category.find({ active: true }).sort({ order: 1 });
    res.json({ success: true, categories });
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};

/**
 * Obter categoria por ID
 */
exports.getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Categoria não encontrada' 
      });
    }
    
    res.json({ success: true, category });
  } catch (error) {
    console.error('Erro ao buscar categoria:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};

/**
 * Criar categoria
 */
exports.createCategory = async (req, res) => {
  try {
    const { name, description, image, order } = req.body;
    
    // Validação básica
    if (!name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nome é obrigatório' 
      });
    }
    
    // Verificar se já existe categoria com mesmo nome
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ 
        success: false, 
        message: 'Já existe uma categoria com este nome' 
      });
    }
    
    // Criar categoria
    const category = new Category({
      name,
      description,
      image,
      order: order || 0,
      active: true
    });
    
    await category.save();
    
    res.status(201).json({
      success: true,
      category
    });
  } catch (error) {
    console.error('Erro ao criar categoria:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};

/**
 * Atualizar categoria
 */
exports.updateCategory = async (req, res) => {
  try {
    const { name, description, image, order, active } = req.body;
    
    // Validação básica
    if (!name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nome é obrigatório' 
      });
    }
    
    // Verificar se já existe outra categoria com mesmo nome
    const existingCategory = await Category.findOne({ 
      name, 
      _id: { $ne: req.params.id } 
    });
    
    if (existingCategory) {
      return res.status(400).json({ 
        success: false, 
        message: 'Já existe outra categoria com este nome' 
      });
    }
    
    // Atualizar categoria
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        image,
        order,
        active
      },
      { new: true }
    );
    
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Categoria não encontrada' 
      });
    }
    
    res.json({
      success: true,
      category
    });
  } catch (error) {
    console.error('Erro ao atualizar categoria:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};

/**
 * Excluir categoria (desativar)
 */
exports.deleteCategory = async (req, res) => {
  try {
    // Verificar se há produtos associados
    const productsCount = await Product.countDocuments({ 
      category: req.params.id,
      available: true
    });
    
    if (productsCount > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Não é possível excluir a categoria pois existem ${productsCount} produtos associados` 
      });
    }
    
    // Desativar categoria (soft delete)
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    );
    
    if (!category) {
      return res.status(404).json({ 
        success: false, 
        message: 'Categoria não encontrada' 
      });
    }
    
    res.json({
      success: true,
      message: 'Categoria excluída com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir categoria:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};