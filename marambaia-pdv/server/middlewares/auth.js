// -----------------------------------------
// middlewares/auth.js
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = mongoose.model('User');

module.exports = async (req, res, next) => {
  try {
    // Verificar header de autorização
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Acesso negado. Token não fornecido' 
      });
    }
    
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'marambaia_secret');
    
    // Buscar usuário
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user || !user.active) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuário inválido ou inativo' 
      });
    }
    
    // Adicionar usuário à requisição
    req.user = user;
    next();
  } catch (error) {
    console.error('Erro de autenticação:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token inválido' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expirado' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: 'Erro no servidor' 
    });
  }
};