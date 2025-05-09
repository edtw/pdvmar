// server.js
const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');

// Carregar configurações
const config = require('./config');
const connectDB = require('./config/database');
const setupSocket = require('./config/socket');

// Inicialização do App
const app = express();
const server = http.createServer(app);

// Conectar ao banco de dados
connectDB();

// Configurar Socket.io
const { socketEvents } = setupSocket(server);
app.set('socketEvents', socketEvents);

// Middlewares globais
app.use(cors(config.CORS_OPTIONS || { origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos das pastas públicas
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Carregar modelos na ordem correta para evitar dependências circulares
require('./models/User');
require('./models/Category');
require('./models/Product');
require('./models/Table');
require('./models/OrderItem'); // Carregar antes de Order
require('./models/Order');     // Carregar depois de OrderItem

// Rotas da API
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tables', require('./routes/tableRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));

// Rota para testar API
app.get('/api', (req, res) => {
  res.json({ 
    message: 'API PDV Marambaia Beach funcionando!',
    version: '1.0.0',
    environment: config.NODE_ENV || 'development'
  });
});

// Configuração para produção
if (config.NODE_ENV === 'production') {
  // Servir arquivos estáticos do frontend
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  // Para qualquer rota não definida, retornar para o React
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
  });
}

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor'
  });
});

// Iniciar servidor
const PORT = config.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT} em modo ${config.NODE_ENV || 'development'}`);
});

// Tratamento de exceções não capturadas
process.on('uncaughtException', (err) => {
  console.error('Exceção não capturada:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Promessa rejeitada não tratada:', err);
  process.exit(1);
});

// Exportar para testes
module.exports = { app, server };