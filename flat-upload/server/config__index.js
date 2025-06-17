// config/index.js
const path = require('path');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente com base no ambiente
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: path.join(__dirname, '..', envFile) });

/**
 * Configuração centralizada do aplicativo
 */
module.exports = {
  // Servidor
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  
  // MongoDB
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/marambaia_pdv',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'marambaia_secret_key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '12h',
  
  // Frontend
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // Upload
  UPLOADS_DIR: path.join(__dirname, '..', 'uploads'),
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  
  // Cors
  CORS_OPTIONS: {
    origin: function (origin, callback) {
      // Permitir requisições sem origin (como apps mobile ou curl)
      if (!origin) return callback(null, true);
      
      const whitelist = [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'https://marambaia-pdv.vercel.app'
      ];
      
      if (whitelist.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
        callback(null, true);
      } else {
        callback(new Error('Bloqueado por CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']
  }
};
