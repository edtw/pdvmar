// services/api.js
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";
const BASE_URL = API_URL.replace("/api", ""); // Remove /api to get base server URL

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Helper to get stored CPF
const getCustomerCpf = () => {
  return sessionStorage.getItem("customerCpf") || null;
};

// Helper to build full image URL
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http")) return imagePath; // Already full URL
  return `${BASE_URL}${imagePath}`; // Prepend base URL
};

// Public API endpoints (no authentication)
export const publicAPI = {
  // Get table by QR token
  getTableByToken: (token) => api.get(`/qrcode/table/${token}`),

  // Get products
  getProducts: (category) => {
    const params = category ? { category } : {};
    return api.get("/public/products", { params });
  },

  // Get categories
  getCategories: () => api.get("/public/categories"),

  // Create customer command
  createCommand: (data) => api.post("/public/commands", data),

  // Get customer order (with CPF verification)
  getOrder: (orderId) => {
    const cpf = getCustomerCpf();
    return api.get(`/public/orders/${orderId}`, {
      params: { customerCpf: cpf },
    });
  },

  // Add item to order (with CPF verification)
  addItem: (orderId, data) => {
    const requestData = {
      ...data,
      customerCpf: getCustomerCpf(),
    };
    return api.post(`/public/orders/${orderId}/items`, requestData);
  },

  // Remove item from order (with CPF verification)
  removeItem: (orderId, itemId) => {
    return api.delete(`/public/orders/${orderId}/items/${itemId}`, {
      data: { customerCpf: getCustomerCpf() },
    });
  },

  // Request bill (with CPF verification)
  requestBill: (orderId) => {
    return api.post(`/public/orders/${orderId}/request-bill`, {
      customerCpf: getCustomerCpf(),
    });
  },

  // Get product recommendations for customer
  getRecommendations: (customerId, limit = 5) => {
    return api.get(`/intelligence/recommendations/${customerId}`, {
      params: { limit },
    });
  },

  // Get upsell suggestions for order
  getUpsellSuggestions: (orderId) => {
    return api.get(`/intelligence/upsell/${orderId}`);
  },

  // Call waiter
  callWaiter: (orderId, data) => {
    return api.post(`/public/orders/${orderId}/call-waiter`, {
      ...data,
      customerCpf: getCustomerCpf(),
    });
  },
};

export default api;
