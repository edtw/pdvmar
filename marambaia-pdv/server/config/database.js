// config/database.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

// Opções de conexão MongoDB
// useNewUrlParser e useUnifiedTopology são deprecated no MongoDB Driver 4.0+
const options = {
  autoIndex: true
};

/**
 * Conectar ao MongoDB
 * @returns {Promise} Conexão MongoDB
 */
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/marambaia_pdv';
    await mongoose.connect(mongoURI, options);
    console.log('MongoDB conectado com sucesso');
    return mongoose.connection;
  } catch (error) {
    console.error('Erro ao conectar ao MongoDB:', error);
    process.exit(1);
  }
};

module.exports = connectDB;