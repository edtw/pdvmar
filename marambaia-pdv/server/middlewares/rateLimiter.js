// middlewares/rateLimiter.js
// BUG FIX #9: Rate limiting middleware

const rateLimit = require('express-rate-limit');

// Limitar rotas públicas
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requisições
  message: {
    success: false,
    message: 'Muitas requisições. Tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limitar login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 tentativas
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Muitas tentativas de login. Aguarde 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limitar criação de comandas (QR Code)
const commandCreationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 3, // 3 comandas por minuto por IP
  message: {
    success: false,
    message: 'Muitas tentativas de criar comanda. Aguarde 1 minuto.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limitar adição de itens
const addItemLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 segundos
  max: 20, // 20 itens por 10 segundos
  message: {
    success: false,
    message: 'Muitos itens adicionados rapidamente. Aguarde alguns segundos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  publicLimiter,
  loginLimiter,
  commandCreationLimiter,
  addItemLimiter
};
