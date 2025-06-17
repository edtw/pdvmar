// src/contexts/SocketContext.js
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
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
  const socketRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 3;

  // Inicializar Socket.io quando autenticado
  useEffect(() => {
    if (isAuthenticated && !socketRef.current) {
      const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';
      
      // Criar instância do Socket.io
      socketRef.current = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 10000,
        forceNew: false,
      });

      // Eventos de conexão
      socketRef.current.on('connect', () => {
        console.log('Socket conectado');
        setConnected(true);
        reconnectAttempts.current = 0;
      });

      socketRef.current.on('disconnect', (reason) => {
        console.log('Socket desconectado:', reason);
        setConnected(false);
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('Erro de conexão Socket:', error.message);
        reconnectAttempts.current++;
        
        if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.error('Máximo de tentativas de reconexão atingido');
          socketRef.current.disconnect();
        }
      });

      setSocket(socketRef.current);
    }

    // Limpeza ao desmontar componente
    return () => {
      if (socketRef.current && !isAuthenticated) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setConnected(false);
      }
    };
  }, [isAuthenticated]);

  // Funções de sala com verificação de conexão
  const joinRoom = (room) => {
    if (socketRef.current && connected) {
      socketRef.current.emit('joinRoom', room);
    }
  };

  const joinTableRoom = () => {
    if (socketRef.current && connected) {
      socketRef.current.emit('joinTableRoom');
    }
  };

  const joinKitchenRoom = () => {
    if (socketRef.current && connected) {
      socketRef.current.emit('joinKitchenRoom');
    }
  };

  const joinSpecificTable = (tableId) => {
    if (socketRef.current && connected && tableId) {
      socketRef.current.emit('joinSpecificTable', tableId);
    }
  };

  const joinReportsRoom = () => {
    if (socketRef.current && connected) {
      socketRef.current.emit('joinReportsRoom');
    }
  };

  const joinCashRoom = () => {
    if (socketRef.current && connected) {
      socketRef.current.emit('joinCashRoom');
    }
  };

  // Valor a ser provido pelo Context
  const value = {
    socket: socketRef.current,
    connected,
    joinRoom,
    joinTableRoom,
    joinKitchenRoom,
    joinSpecificTable,
    joinReportsRoom,
    joinCashRoom,
    requestDataUpdate: () => {
      if (socketRef.current && connected) {
        socketRef.current.emit('requestDataUpdate');
      }
    }
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketContext;