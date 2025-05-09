// config/socket.js
const socketIo = require('socket.io');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

/**
 * Configurar Socket.io para comunicação em tempo real
 * @param {Object} server - Servidor HTTP
 * @returns {Object} Socket.io e eventos
 */
const setupSocket = (server) => {
  // Criar instância do Socket.io
  const io = socketIo(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });
  
  // Eventos do Socket.io
  io.on('connection', (socket) => {
    console.log('Novo cliente conectado');
    
    // Salas específicas para diferentes áreas do app
    socket.on('joinTableRoom', () => {
      socket.join('tables');
      console.log('Cliente entrou na sala: tables');
    });
    
    socket.on('joinKitchenRoom', () => {
      socket.join('kitchen');
      console.log('Cliente entrou na sala: kitchen');
    });
    
    socket.on('joinSpecificTable', (tableId) => {
      socket.join(`table-${tableId}`);
      console.log(`Cliente entrou na sala: table-${tableId}`);
    });
    
    socket.on('disconnect', () => {
      console.log('Cliente desconectado');
    });
  });
  
  // Funções de emissão de eventos
  const socketEvents = {
    // Emitir atualização de mesa para todos os clientes na sala 'tables'
    emitTableUpdate: (tableId) => {
      io.to('tables').emit('tableUpdate', { tableId });
    },
    
    // Emitir atualização de pedido para mesa específica e cozinha
    emitOrderUpdate: (orderId, tableId, status) => {
      io.to(`table-${tableId}`).emit('orderUpdate', { orderId, status });
      io.to('kitchen').emit('orderStatusChanged', { orderId, status });
    },
    
    // Emitir novo pedido para a cozinha
    emitNewOrder: (order) => {
      io.to('kitchen').emit('newOrder', { order });
    }
  };
  
  return { io, socketEvents };
};

module.exports = setupSocket;