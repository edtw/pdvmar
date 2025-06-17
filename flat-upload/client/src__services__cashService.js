// src/services/cashService.js
import api from './api';

// Formatar moeda brasileira
export const formatCurrency = (value) => {
  if (value === null || value === undefined) return '0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Buscar todos os caixas
export const fetchCashRegisters = async () => {
  try {
    const response = await api.get('/cash-registers');
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar caixas:', error);
    throw error;
  }
};

// Buscar caixa por ID
export const fetchCashRegisterById = async (id) => {
  try {
    const response = await api.get(`/cash-registers/${id}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar caixa:', error);
    throw error;
  }
};

// Buscar transações de um caixa
export const fetchCashTransactions = async (cashRegisterId, startDate, endDate) => {
  try {
    let url = `/cash-registers/${cashRegisterId}/transactions`;
    
    const params = new URLSearchParams();
    
    if (startDate) {
      const startDateStr = startDate.toISOString().split('T')[0];
      params.append('startDate', startDateStr);
    }
    
    if (endDate) {
      const endDateStr = endDate.toISOString().split('T')[0];
      params.append('endDate', endDateStr);
    }
    
    const queryString = params.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    throw error;
  }
};

// Abrir caixa
export const openCashRegister = async (cashRegisterId, openingBalance) => {
  try {
    const response = await api.post(`/cash-registers/${cashRegisterId}/open`, {
      openingBalance
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao abrir caixa:', error);
    throw error;
  }
};

// Fechar caixa
export const closeCashRegister = async (cashRegisterId, closingBalance, cashCount = null) => {
  try {
    const response = await api.post(`/cash-registers/${cashRegisterId}/close`, {
      closingBalance,
      cashCount
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao fechar caixa:', error);
    throw error;
  }
};

// Adicionar dinheiro
export const addCash = async (cashRegisterId, amount, description) => {
  try {
    const response = await api.post(`/cash-registers/${cashRegisterId}/deposit`, {
      amount,
      description
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao adicionar dinheiro:', error);
    throw error;
  }
};

// Retirar dinheiro
export const withdrawCash = async (cashRegisterId, amount, description) => {
  try {
    const response = await api.post(`/cash-registers/${cashRegisterId}/withdraw`, {
      amount,
      description
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao retirar dinheiro:', error);
    throw error;
  }
};

// Realizar sangria
export const drainCash = async (cashRegisterId, amount, destination) => {
  try {
    const response = await api.post(`/cash-registers/${cashRegisterId}/drain`, {
      amount,
      destination
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao realizar sangria:', error);
    throw error;
  }
};

// Obter relatório
export const getCashReport = async (cashRegisterId, startDate, endDate) => {
  try {
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    const response = await api.get(
      `/cash-registers/${cashRegisterId}/report?startDate=${startDateStr}&endDate=${endDateStr}`
    );
    
    return response.data;
  } catch (error) {
    console.error('Erro ao obter relatório:', error);
    throw error;
  }
};