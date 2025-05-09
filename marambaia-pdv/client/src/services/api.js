import axios from 'axios';

// Configuração base do axios
const api = axios.create({
  // Remova 'api/' da baseURL, pois já está incluído nas rotas do servidor
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api'
});

// Interceptor para incluir o token em todas as requisições
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Interceptor para tratamento de erros
api.interceptors.response.use(
  response => response,
  error => {
    // Tratar erros de autenticação (401)
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirecionar para login se não for a página de login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;