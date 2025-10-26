// config/socket.js
const socketIo = require("socket.io");

/**
 * Configurar Socket.io para comunicação em tempo real
 * @param {Object} server - Servidor HTTP
 * @returns {Object} Socket.io e eventos
 */
const setupSocket = (server) => {
  // Criar instância do Socket.io
  const io = socketIo(server, {
    cors: {
      origin: [
        "http://localhost:3000",
        "http://192.168.0.4:3000",
        "http://localhost:3002",
        "http://192.168.0.4:3002",
        process.env.FRONTEND_URL,
        process.env.CUSTOMER_APP_URL
      ].filter(Boolean),
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Mapeamento de clientes para salas (para evitar entradas repetidas)
  const clientRooms = new Map();
  // BUG FIX #5: Track heartbeats to prevent memory leak
  const clientHeartbeats = new Map();

  // BUG FIX #5: Cleanup periódico (a cada 5 minutos)
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    const TIMEOUT = 10 * 60 * 1000; // 10 minutos

    for (const [socketId, lastHeartbeat] of clientHeartbeats.entries()) {
      if (now - lastHeartbeat > TIMEOUT) {
        const rooms = Array.from(clientRooms.get(socketId) || []);
        console.log(`[Socket Cleanup] Removing inactive socket: ${socketId} (rooms: ${rooms.join(', ')})`);

        clientRooms.delete(socketId);
        clientHeartbeats.delete(socketId);
      }
    }
  }, 5 * 60 * 1000);

  // Eventos do Socket.io
  io.on("connection", (socket) => {
    console.log(`Novo cliente conectado: ${socket.id}`);

    // Inicializar conjunto de salas para este cliente
    clientRooms.set(socket.id, new Set());
    // Registrar heartbeat inicial
    clientHeartbeats.set(socket.id, Date.now());

    // Função auxiliar para entrar em uma sala sem repetição
    const joinRoomOnce = (room) => {
      let clientRoomSet = clientRooms.get(socket.id);

      // Se o socket foi removido pelo cleanup, reinicializar
      if (!clientRoomSet) {
        clientRoomSet = new Set();
        clientRooms.set(socket.id, clientRoomSet);
        clientHeartbeats.set(socket.id, Date.now());
      }

      // Verificar se o cliente já está na sala
      if (!clientRoomSet.has(room)) {
        socket.join(room);
        clientRoomSet.add(room);
        console.log(`Cliente ${socket.id} entrou na sala: ${room}`);
      }
    };

    socket.on("joinTableRoom", () => {
      joinRoomOnce("tables");
    });

    socket.on("joinKitchenRoom", () => {
      joinRoomOnce("kitchen");
    });

    socket.on("joinWaitersRoom", () => {
      joinRoomOnce("waiters");
    });

    socket.on("joinSpecificTable", (tableId) => {
      if (tableId) {
        joinRoomOnce(`table-${tableId}`);
      }
    });

    // Sala específica para um pedido (cliente acompanha seu pedido)
    socket.on("joinSpecificOrder", (orderId) => {
      if (orderId) {
        joinRoomOnce(`order-${orderId}`);
      }
    });

    // Sair da sala de um pedido específico
    socket.on("leaveSpecificOrder", (orderId) => {
      if (orderId) {
        const clientRoomSet = clientRooms.get(socket.id);
        const room = `order-${orderId}`;
        if (clientRoomSet && clientRoomSet.has(room)) {
          socket.leave(room);
          clientRoomSet.delete(room);
          console.log(`Cliente ${socket.id} saiu da sala: ${room}`);
        }
      }
    });

    socket.on("joinReportsRoom", () => {
      joinRoomOnce("reports");
    });

    // Sala específica para caixa
    socket.on("joinCashRoom", () => {
      joinRoomOnce("cash");
    });

    // Sala para notificações de clientes
    socket.on("joinCustomerNotifications", () => {
      joinRoomOnce("customerNotifications");
    });

    // Solicitação de atualização de dados
    socket.on("requestDataUpdate", () => {
      const timestamp = Date.now();
      io.emit("dataUpdate", { timestamp });
      console.log(`Cliente ${socket.id} solicitou atualização de dados`);
    });

    // BUG FIX #5: Heartbeat handler
    socket.on("heartbeat", () => {
      clientHeartbeats.set(socket.id, Date.now());
    });

    socket.on("disconnect", () => {
      console.log(`Cliente desconectado: ${socket.id}`);
      clientRooms.delete(socket.id);
      clientHeartbeats.delete(socket.id);
    });
  });

  // Funções de emissão de eventos
  const socketEvents = {
    // Emitir atualização de mesa para todos os clientes na sala 'tables'
    emitTableUpdate: (tableId) => {
      io.to("tables").emit("tableUpdate", {
        tableId,
        timestamp: Date.now(),
      });
      console.log(`Evento tableUpdate emitido para tableId: ${tableId}`);
    },

    // Emitir atualização de pedido para mesa específica e cozinha
    emitOrderUpdate: (orderId, tableId, status, orderData = null) => {
      // Emitir para sala específica do pedido (cliente)
      const payload = {
        orderId,
        status,
        timestamp: Date.now(),
      };

      // Include full order data if provided (for real-time updates)
      if (orderData) {
        payload.order = orderData;
      }

      io.to(`order-${orderId}`).emit("orderUpdate", payload);

      if (tableId) {
        io.to(`table-${tableId}`).emit("orderUpdate", payload);
      }

      io.to("kitchen").emit("orderStatusChanged", {
        orderId,
        status,
        timestamp: Date.now(),
      });

      // Emitir também para a sala de relatórios para atualização
      io.to("reports").emit("orderUpdate", {
        orderId,
        status,
        timestamp: Date.now(),
      });

      console.log(
        `Evento orderUpdate emitido para orderId: ${orderId}, status: ${status}${orderData ? ' (com dados completos)' : ''}`
      );
    },

    // Emitir mudança de status de item específico
    emitItemStatusChanged: (orderId, itemId, status, tableId) => {
      // Emitir para sala específica do pedido (cliente)
      io.to(`order-${orderId}`).emit("itemStatusChanged", {
        orderId,
        itemId,
        status,
        timestamp: Date.now(),
      });

      // Emitir para garçons
      io.to("waiters").emit("itemStatusChanged", {
        orderId,
        itemId,
        status,
        tableId,
        timestamp: Date.now(),
      });

      console.log(
        `Evento itemStatusChanged emitido para orderId: ${orderId}, itemId: ${itemId}, status: ${status}`
      );
    },

    // Emitir atualização de caixa
    emitCashRegisterUpdate: (cashRegisterId) => {
      io.to("cash").emit("cashRegisterUpdate", {
        cashRegisterId,
        timestamp: Date.now(),
      });

      // Também emitir para relatórios
      io.to("reports").emit("cashRegisterUpdate", {
        cashRegisterId,
        timestamp: Date.now(),
      });

      console.log(
        `Evento cashRegisterUpdate emitido para cashRegisterId: ${cashRegisterId}`
      );
    },

    // Emitir novo pedido para a cozinha (APENAS COMIDA) e garçom (TODOS)
    emitNewOrder: (orderData) => {
      const { item, orderId, tableId } = orderData;

      // COZINHA: Recebe APENAS itens de comida (food)
      if (item && item.product && item.product.productType === 'food') {
        io.to("kitchen").emit("newOrder", {
          item,
          orderId,
          tableId,
          timestamp: Date.now(),
        });
        console.log(`[Kitchen] Novo pedido de COMIDA emitido: ${item.product.name}`);
      }

      // GARÇOM: Recebe TODOS os itens (comida + bebida)
      io.to("waiters").emit("newOrder", {
        item,
        orderId,
        tableId,
        timestamp: Date.now(),
      });
      console.log(`[Waiter] Novo pedido emitido: ${item?.product?.name || 'Unknown'}`);

      // Emitir também para a sala de relatórios
      io.to("reports").emit("newOrder", {
        orderId,
        tableId,
        timestamp: Date.now(),
      });
    },

    // Evento para forçar atualização completa de dados
    emitDataUpdate: () => {
      const timestamp = Date.now();

      // Emitir para todas as salas relevantes
      io.to("reports").emit("dataUpdate", { timestamp });
      io.to("tables").emit("dataUpdate", { timestamp });
      io.to("kitchen").emit("dataUpdate", { timestamp });
      io.to("cash").emit("dataUpdate", { timestamp });

      console.log("Evento dataUpdate emitido para todas as salas");
    },

    // Novo evento: Cliente criou uma comanda
    emitCustomerOrderCreated: (orderId, tableId, customer) => {
      io.to("tables").emit("customerOrderCreated", {
        orderId,
        tableId,
        customer: {
          name: customer.name,
          cpf: customer.cpf
        },
        timestamp: Date.now(),
      });

      io.to("customerNotifications").emit("customerOrderCreated", {
        orderId,
        tableId,
        customer,
        timestamp: Date.now(),
      });

      console.log(
        `Evento customerOrderCreated emitido para orderId: ${orderId}, tableId: ${tableId}`
      );
    },

    // Novo evento: Cliente solicitou a conta
    emitBillRequested: (orderId, tableId, customer) => {
      io.to("tables").emit("billRequested", {
        orderId,
        tableId,
        customer: {
          name: customer.name,
          cpf: customer.cpf
        },
        timestamp: Date.now(),
      });

      io.to("customerNotifications").emit("billRequested", {
        orderId,
        tableId,
        customer,
        timestamp: Date.now(),
      });

      // Também emitir para a sala de relatórios
      io.to("reports").emit("billRequested", {
        orderId,
        tableId,
        timestamp: Date.now(),
      });

      console.log(
        `Evento billRequested emitido para orderId: ${orderId}, tableId: ${tableId}`
      );
    },

    // Novo evento: Cliente chamou o garçom
    emitWaiterCalled: (orderId, tableId, customer, reason) => {
      // Emitir para garçons
      io.to("waiters").emit("waiterCalled", {
        orderId,
        tableId,
        customer: {
          name: customer.name,
          cpf: customer.cpf
        },
        reason,
        timestamp: Date.now(),
      });

      // Emitir para sala de mesas (admin/manager)
      io.to("tables").emit("waiterCalled", {
        orderId,
        tableId,
        customer: {
          name: customer.name,
          cpf: customer.cpf
        },
        reason,
        timestamp: Date.now(),
      });

      console.log(
        `Evento waiterCalled emitido - Mesa: ${tableId}, Cliente: ${customer.name}, Razão: ${reason}`
      );
    },

    // Novo evento: Alerta de item atrasado
    emitDelayAlert: (alert) => {
      // Emitir para garçons (precisam saber que item está atrasado)
      io.to("waiters").emit("delayAlert", {
        ...alert,
        timestamp: Date.now(),
      });

      // Emitir para cozinha (precisam acelerar preparo)
      io.to("kitchen").emit("delayAlert", {
        ...alert,
        timestamp: Date.now(),
      });

      // Emitir para managers/admins (analytics em tempo real)
      io.to("tables").emit("delayAlert", {
        ...alert,
        timestamp: Date.now(),
      });

      console.log(
        `[Delay Alert] Item atrasado - Mesa: ${alert.tableNumber}, Produto: ${alert.productName}, Severidade: ${alert.severity}`
      );
    },
  };

  return { io, socketEvents };
};

module.exports = setupSocket;
