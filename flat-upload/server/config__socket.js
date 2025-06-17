// config/socket.js
const socketIo = require('socket.io');

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
  
  // Mapeamento de clientes para salas (para evitar entradas repetidas)
  const clientRooms = new Map();
  
  // Eventos do Socket.io
  io.on('connection', (socket) => {
    console.log(`Novo cliente conectado: ${socket.id}`);
    
    // Inicializar conjunto de salas para este cliente
    clientRooms.set(socket.id, new Set());
    
    // Função auxiliar para entrar em uma sala sem repetição
    const joinRoomOnce = (room) => {
      const clientRoomSet = clientRooms.get(socket.id);
      
      // Verificar se o cliente já está na sala
      if (!clientRoomSet.has(room)) {
        socket.join(room);
        clientRoomSet.add(room);
        console.log(`Cliente ${socket.id} entrou na sala: ${room}`);
      }
    };
    
    // Salas específicas para diferentes áreas do app
    socket.on('joinTableRoom', () => {
      joinRoomOnce('tables');
    });
    
    socket.on('joinKitchenRoom', () => {
      joinRoomOnce('kitchen');
    });
    
    socket.on('joinSpecificTable', (tableId) => {
      if (tableId) {
        joinRoomOnce(`table-${tableId}`);
      }
    });
    
    socket.on('joinReportsRoom', () => {
      joinRoomOnce('reports');
    });
    
    // Sala específica para caixa
    socket.on('joinCashRoom', () => {
      joinRoomOnce('cash');
    });
    
    // Solicitação de atualização de dados
    socket.on('requestDataUpdate', () => {
      const timestamp = Date.now();
      io.emit('dataUpdate', { timestamp });
      console.log(`Cliente ${socket.id} solicitou atualização de dados`);
    });
    
    socket.on('disconnect', () => {
      console.log(`Cliente desconectado: ${socket.id}`);
      clientRooms.delete(socket.id);
    });
  });
  
  // Funções de emissão de eventos
  const socketEvents = {
    // Emitir atualização de mesa para todos os clientes na sala 'tables'
    emitTableUpdate: (tableId) => {
      io.to('tables').emit('tableUpdate', { 
        tableId,
        timestamp: Date.now() 
      });
      console.log(`Evento tableUpdate emitido para tableId: ${tableId}`);
    },
    
    // Emitir atualização de pedido para mesa específica e cozinha
    emitOrderUpdate: (orderId, tableId, status) => {
      if (tableId) {
        io.to(`table-${tableId}`).emit('orderUpdate', { 
          orderId, 
          status,
          timestamp: Date.now() 
        });
      }
      
      io.to('kitchen').emit('orderStatusChanged', { 
        orderId, 
        status,
        timestamp: Date.now() 
      });
      
      // Emitir também para a sala de relatórios para atualização
      io.to('reports').emit('orderUpdate', { 
        orderId, 
        status,
        timestamp: Date.now() 
      });
      
      console.log(`Evento orderUpdate emitido para orderId: ${orderId}, status: ${status}`);
    },
    
    // Emitir atualização de caixa
    emitCashRegisterUpdate: (cashRegisterId) => {
      io.to('cash').emit('cashRegisterUpdate', { 
        cashRegisterId,
        timestamp: Date.now() 
      });
      
      // Também emitir para relatórios
      io.to('reports').emit('cashRegisterUpdate', { 
        cashRegisterId,
        timestamp: Date.now() 
      });
      
      console.log(`Evento cashRegisterUpdate emitido para cashRegisterId: ${cashRegisterId}`);
    },
    
    // Emitir novo pedido para a cozinha
    emitNewOrder: (order) => {
      io.to('kitchen').emit('newOrder', { 
        order,
        timestamp: Date.now() 
      });
      
      // Emitir também para a sala de relatórios para atualização
      io.to('reports').emit('newOrder', {
        orderId: order._id || order.orderId,
        tableId: order.table || order.tableId,
        timestamp: Date.now()
      });
      
      console.log(`Evento newOrder emitido para orderId: ${order._id || order.orderId}`);
    },
    
    // Evento para forçar atualização completa de dados
    emitDataUpdate: () => {
      const timestamp = Date.now();
      
      // Emitir para todas as salas relevantes
      io.to('reports').emit('dataUpdate', { timestamp });
      io.to('tables').emit('dataUpdate', { timestamp });
      io.to('kitchen').emit('dataUpdate', { timestamp });
      io.to('cash').emit('dataUpdate', { timestamp });
      
      console.log('Evento dataUpdate emitido para todas as salas');
    }
  };
  
  return { io, socketEvents };
};

module.exports = setupSocket;