// contexts/SocketContext.js
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import io from "socket.io-client";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [orderUpdates, setOrderUpdates] = useState([]);

  useEffect(() => {
    // Conectar ao servidor WebSocket
    const newSocket = io(process.env.APP_API_URL.replace("/api", ""), {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    newSocket.on("connect", () => {
      console.log("[Socket] Conectado ao servidor");
      setConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("[Socket] Desconectado do servidor");
      setConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("[Socket] Erro de conexão:", error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Entrar na sala de um pedido específico
  const joinOrderRoom = useCallback(
    (orderId) => {
      if (socket && orderId) {
        socket.emit("joinSpecificOrder", orderId);
        console.log(`[Socket] Entrou na sala do pedido: ${orderId}`);
      }
    },
    [socket]
  );

  // Sair da sala de um pedido
  const leaveOrderRoom = useCallback(
    (orderId) => {
      if (socket && orderId) {
        socket.emit("leaveSpecificOrder", orderId);
        console.log(`[Socket] Saiu da sala do pedido: ${orderId}`);
      }
    },
    [socket]
  );

  // Escutar atualizações do pedido
  const onOrderUpdate = useCallback(
    (callback) => {
      if (socket) {
        socket.on("orderUpdate", callback);
        return () => socket.off("orderUpdate", callback);
      }
    },
    [socket]
  );

  // Escutar mudanças de status de itens
  const onItemStatusChange = useCallback(
    (callback) => {
      if (socket) {
        socket.on("itemStatusChanged", callback);
        return () => socket.off("itemStatusChanged", callback);
      }
    },
    [socket]
  );

  // Escutar quando pedido está pronto
  const onOrderReady = useCallback(
    (callback) => {
      if (socket) {
        socket.on("orderReady", callback);
        return () => socket.off("orderReady", callback);
      }
    },
    [socket]
  );

  const value = {
    socket,
    connected,
    joinOrderRoom,
    leaveOrderRoom,
    onOrderUpdate,
    onItemStatusChange,
    onOrderReady,
    orderUpdates,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
