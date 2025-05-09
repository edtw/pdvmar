// controllers/uploadController.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Upload de imagem
 */
exports.uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Nenhum arquivo enviado.'
    });
  }
  
  // Caminho relativo para o frontend acessar a imagem
  const filePath = `/uploads/${req.file.filename}`;
  
  res.json({
    success: true,
    filePath,
    fileName: req.file.filename
  });
};

/**
 * Excluir imagem
 */
exports.deleteImage = (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, '../uploads', filename);
  
  // Verificar se arquivo existe
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      message: 'Arquivo não encontrado.'
    });
  }
  
  // Remover arquivo
  try {
    fs.unlinkSync(filePath);
    res.json({
      success: true,
      message: 'Arquivo removido com sucesso.'
    });
  } catch (error) {
    console.error('Erro ao remover arquivo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao remover arquivo.'
    });
  }
};