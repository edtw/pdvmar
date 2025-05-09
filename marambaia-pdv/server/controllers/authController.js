// controllers/authController.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = mongoose.model('User');

/**
 * Login do usuário
 */
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validação básica
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Usuário e senha são obrigatórios' 
      });
    }
    
    // Buscar usuário
    const user = await User.findOne({ username, active: true });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Credenciais inválidas' 
      });
    }
    
    // Verificar senha
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Credenciais inválidas' 
      });
    }
    
    // Criar token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'marambaia_secret',
      { expiresIn: '12h' }
    );
    
    // Retornar dados do usuário e token
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};

/**
 * Validar token de autenticação
 */
exports.validateToken = (req, res) => {
  res.json({ 
    success: true, 
    user: req.user 
  });
};

/**
 * Registrar novo usuário (apenas admin)
 */
exports.register = async (req, res) => {
  try {
    // Verificar se é admin
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ 
        success: false, 
        message: 'Não autorizado' 
      });
    }
    
    const { name, username, password, role } = req.body;
    
    // Validar dados
    if (!name || !username || !password || !role) {
      return res.status(400).json({ 
        success: false, 
        message: 'Todos os campos são obrigatórios' 
      });
    }
    
    // Verificar se usuário já existe
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nome de usuário já existe' 
      });
    }
    
    // Criar usuário
    const user = new User({
      name,
      username,
      password,
      role
    });
    
    await user.save();
    
    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erro ao cadastrar usuário:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};

/**
 * Listar todos os usuários (apenas admin)
 */
exports.listUsers = async (req, res) => {
  try {
    // Verificar se é admin
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ 
        success: false, 
        message: 'Não autorizado' 
      });
    }
    
    const users = await User.find({}, '-password');
    res.json({ success: true, users });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};