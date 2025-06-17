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

// Middleware para aplicações que usam datas - MOVIDO PARA ANTES DAS ROTAS
app.use((req, res, next) => {
  // Se a requisição tiver query params de data
  if (req.query.startDate) {
    try {
      const startDate = new Date(req.query.startDate);
      console.log(`[Date Middleware] startDate original: ${req.query.startDate}`);
      console.log(`[Date Middleware] startDate parseada: ${startDate.toISOString()}`);
      
      // Se a data original já vier com hora configurada, manter a hora
      if (req.query.startDate.includes('T')) {
        console.log(`[Date Middleware] startDate mantém hora original`);
        req.query.startDate = startDate.toISOString();
      } else {
        // Ajustar para o início do dia local (00:00:00)
        const localStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0);
        req.query.startDate = localStartDate.toISOString();
        console.log(`[Date Middleware] startDate ajustada: ${req.query.startDate}`);
      }
    } catch (error) {
      console.error(`[Date Middleware] Erro ao processar startDate: ${error.message}`);
    }
  }
  
  if (req.query.endDate) {
    try {
      const endDate = new Date(req.query.endDate);
      console.log(`[Date Middleware] endDate original: ${req.query.endDate}`);
      console.log(`[Date Middleware] endDate parseada: ${endDate.toISOString()}`);
      
      // Se a data original já vier com hora configurada, manter a hora
      if (req.query.endDate.includes('T')) {
        console.log(`[Date Middleware] endDate mantém hora original`);
        req.query.endDate = endDate.toISOString();
      } else {
        // Ajustar para o final do dia local (23:59:59.999)
        const localEndDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999);
        req.query.endDate = localEndDate.toISOString();
        console.log(`[Date Middleware] endDate ajustada: ${req.query.endDate}`);
      }
    } catch (error) {
      console.error(`[Date Middleware] Erro ao processar endDate: ${error.message}`);
    }
  }
  
  next();
});

// Servir arquivos estáticos das pastas públicas
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Carregar modelos na ordem correta para evitar dependências circulares
require('./models/User');
require('./models/Category');
require('./models/Product');
require('./models/Table');
require('./models/OrderItem'); // Carregar antes de Order
require('./models/Order');     // Carregar depois de OrderItem
require('./models/CashRegister');
require('./models/CashTransaction');
require('./models/Backup')

// Rotas da API
app.use('/api/print', require('./routes/printRoutes'));
app.use('/api/backups', require('./routes/backupRoutes'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tables', require('./routes/tableRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));
app.use('/api/cash-registers', require('./routes/cashRegisterRoutes'));

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