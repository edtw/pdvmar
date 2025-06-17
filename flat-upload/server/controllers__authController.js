// controllers/authController.js (atualizado)
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
    // Verificar se é admin ou gerente
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ 
        success: false, 
        message: 'Não autorizado' 
      });
    }
    
    const { name, username, password, role, active } = req.body;
    
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
    
    // Verificar se é admin tentando criar outro admin
    if (role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Apenas administradores podem criar outros administradores' 
      });
    }
    
    // Criar usuário
    const user = new User({
      name,
      username,
      password,
      role,
      active: active !== undefined ? active : true
    });
    
    await user.save();
    
    res.status(201).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        active: user.active
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
 * Listar todos os usuários (apenas admin/gerente)
 */
exports.listUsers = async (req, res) => {
  try {
    // Verificar se é admin ou gerente
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ 
        success: false, 
        message: 'Não autorizado' 
      });
    }
    
    // Se for gerente, não mostrar admins
    let filter = {};
    if (req.user.role === 'manager') {
      filter = { role: { $ne: 'admin' } };
    }
    
    const users = await User.find(filter, '-password');
    res.json({ success: true, users });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};

/**
 * Obter usuário por ID
 */
exports.getUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar permissões (admin pode ver todos, gerente não pode ver admins)
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ 
        success: false, 
        message: 'Não autorizado' 
      });
    }
    
    const user = await User.findById(id, '-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuário não encontrado' 
      });
    }
    
    // Gerentes não podem ver detalhes de administradores
    if (req.user.role === 'manager' && user.role === 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Não autorizado a visualizar administradores' 
      });
    }
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};

/**
 * Atualizar usuário por ID
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, username, password, role, active } = req.body;
    
    // Verificar permissões
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ 
        success: false, 
        message: 'Não autorizado' 
      });
    }
    
    // Buscar usuário
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuário não encontrado' 
      });
    }
    
    // Verificar permissões específicas
    if (req.user.role === 'manager') {
      // Gerentes não podem editar administradores
      if (user.role === 'admin') {
        return res.status(403).json({ 
          success: false, 
          message: 'Gerentes não podem editar administradores' 
        });
      }
      
      // Gerentes não podem transformar usuários em administradores
      if (role === 'admin') {
        return res.status(403).json({ 
          success: false, 
          message: 'Gerentes não podem criar administradores' 
        });
      }
    }
    
    // Verificar se existe outro usuário com o mesmo username
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username, _id: { $ne: id } });
      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          message: 'Nome de usuário já existe' 
        });
      }
    }
    
    // Atualizar dados básicos
    if (name) user.name = name;
    if (username) user.username = username;
    if (role) user.role = role;
    if (active !== undefined) user.active = active;
    
    // Atualizar senha se fornecida
    if (password) {
      user.password = password; // O modelo já faz o hash antes de salvar
    }
    
    await user.save();
    
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        role: user.role,
        active: user.active
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};

/**
 * Alternar status do usuário (ativar/desativar)
 */
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;
    
    // Verificar permissões
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ 
        success: false, 
        message: 'Não autorizado' 
      });
    }
    
    // Não permitir desativar o próprio usuário
    if (id === req.user.id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Não é possível desativar o próprio usuário' 
      });
    }
    
    // Buscar usuário
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuário não encontrado' 
      });
    }
    
    // Verificar permissões específicas (gerentes não podem desativar administradores)
    if (req.user.role === 'manager' && user.role === 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Gerentes não podem alterar status de administradores' 
      });
    }
    
    // Atualizar status
    user.active = active !== undefined ? active : !user.active;
    await user.save();
    
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        active: user.active
      }
    });
  } catch (error) {
    console.error('Erro ao alternar status do usuário:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};

/**
 * Redefinir senha de usuário
 */
exports.resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    // Verificar permissões
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ 
        success: false, 
        message: 'Não autorizado' 
      });
    }
    
    // Validar senha
    if (!password || password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Senha deve ter pelo menos 6 caracteres' 
      });
    }
    
    // Buscar usuário
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuário não encontrado' 
      });
    }
    
    // Verificar permissões específicas (gerentes não podem alterar senhas de administradores)
    if (req.user.role === 'manager' && user.role === 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Gerentes não podem redefinir senhas de administradores' 
      });
    }
    
    // Atualizar senha
    user.password = password;
    await user.save();
    
    res.json({
      success: true,
      message: 'Senha redefinida com sucesso'
    });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};