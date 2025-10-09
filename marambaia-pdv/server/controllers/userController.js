// controllers/userController.js
const mongoose = require('mongoose');
const User = mongoose.model('User');

/**
 * List all users with optional filtering
 */
exports.listUsers = async (req, res) => {
  try {
    const { role, active } = req.query;

    // Build filter
    const filter = {};
    if (role) {
      filter.role = role;
    }
    if (active !== undefined) {
      filter.active = active === 'true';
    }

    const users = await User.find(filter)
      .select('-password') // Never return passwords
      .sort({ name: 1 });

    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error listing users:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao listar usuários',
      error: error.message
    });
  }
};

/**
 * Get user by ID
 */
exports.getUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar usuário',
      error: error.message
    });
  }
};
