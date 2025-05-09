import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

// Criar o Context
const SocketContext = createContext();

// Hook customizado para usar o SocketContext
export const useSocket = () => {
  return useContext(SocketContext);
};

// Provider do SocketContext
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { isAuthenticated } = useAuth();

  // Inicializar Socket.io quando autenticado
  useEffect(() => {
    let socketInstance = null;

    if (isAuthenticated) {
      const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';
      
      // Criar instância do Socket.io
      socketInstance = io(SOCKET_URL, {
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      // Eventos de conexão
      socketInstance.on('connect', () => {
        console.log('Socket conectado');
        setConnected(true);
      });

      socketInstance.on('disconnect', () => {
        console.log('Socket desconectado');
        setConnected(false);
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Erro de conexão Socket:', error);
        setConnected(false);
      });

      setSocket(socketInstance);
    }

    // Limpeza ao desmontar componente
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [isAuthenticated]);

  // Entrar em uma sala
  const joinRoom = (room) => {
    if (socket && connected) {
      socket.emit('joinRoom', room);
    }
  };

  // Entrar na sala de mesas
  const joinTableRoom = () => {
    if (socket && connected) {
      socket.emit('joinTableRoom');
    }
  };

  // Entrar na sala da cozinha
  const joinKitchenRoom = () => {
    if (socket && connected) {
      socket.emit('joinKitchenRoom');
    }
  };

  // Entrar na sala de uma mesa específica
  const joinSpecificTable = (tableId) => {
    if (socket && connected && tableId) {
      socket.emit('joinSpecificTable', tableId);
    }
  };

  // Valor a ser provido pelo Context
  const value = {
    socket,
    connected,
    joinRoom,
    joinTableRoom,
    joinKitchenRoom,
    joinSpecificTable
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;