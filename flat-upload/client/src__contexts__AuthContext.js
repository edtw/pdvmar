import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

// Criar o Context
const AuthContext = createContext();

// Hook customizado para usar o AuthContext
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider do AuthContext
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Efeito para verificar autenticação ao iniciar
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await api.get('/auth/validate');
          if (response.data.success) {
            setUser(response.data.user);
            setIsAuthenticated(true);
          } else {
            logout();
          }
        } catch (error) {
          console.error('Erro ao validar token:', error);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  // Função de login
  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      
      if (response.data.success) {
        const { token, user } = response.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        setToken(token);
        setUser(user);
        setIsAuthenticated(true);
        
        return { success: true };
      }
      
      return { 
        success: false, 
        message: response.data.message || 'Erro no login' 
      };
    } catch (error) {
      console.error('Erro no login:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Erro ao conectar ao servidor' 
      };
    }
  };

  // Função de logout
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  // Verificar se usuário tem determinada permissão
  const hasPermission = (requiredRoles) => {
    if (!user || !requiredRoles) return false;
    
    if (Array.isArray(requiredRoles)) {
      return requiredRoles.includes(user.role);
    }
    
    return user.role === requiredRoles;
  };

  // Valor a ser provido pelo Context
  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    logout,
    hasPermission
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;