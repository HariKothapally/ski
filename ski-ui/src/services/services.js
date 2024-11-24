import axios from 'axios';
import { API_BASE_URL } from './config';

// Create base axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Resource-specific services
export const inventoryService = {
  getAll: () => api.get('/api/inventory'),
  getById: (id) => api.get(`/api/inventory/${id}`),
  create: (data) => api.post('/api/inventory', data),
  update: (id, data) => api.put(`/api/inventory/${id}`, data),
  delete: (id) => api.delete(`/api/inventory/${id}`)
};

export const menuService = {
  getAll: () => api.get('/api/menus'),
  getById: (id) => api.get(`/api/menus/${id}`),
  create: (data) => api.post('/api/menus', data),
  update: (id, data) => api.put(`/api/menus/${id}`, data),
  delete: (id) => api.delete(`/api/menus/${id}`)
};

export const orderService = {
  getAll: () => api.get('/api/orders'),
  getById: (id) => api.get(`/api/orders/${id}`),
  create: (data) => api.post('/api/orders', data),
  update: (id, data) => api.put(`/api/orders/${id}`, data),
  delete: (id) => api.delete(`/api/orders/${id}`)
};

export const eventService = {
  getAll: () => api.get('/api/events'),
  getById: (id) => api.get(`/api/events/${id}`),
  create: (data) => api.post('/api/events', data),
  update: (id, data) => api.put(`/api/events/${id}`, data),
  delete: (id) => api.delete(`/api/events/${id}`)
};

export const qualityService = {
  getAll: () => api.get('/api/quality'),
  getById: (id) => api.get(`/api/quality/${id}`),
  create: (data) => api.post('/api/quality', data),
  update: (id, data) => api.put(`/api/quality/${id}`, data),
  delete: (id) => api.delete(`/api/quality/${id}`)
};

export const supplierService = {
  getAll: () => api.get('/api/suppliers'),
  getById: (id) => api.get(`/api/suppliers/${id}`),
  create: (data) => api.post('/api/suppliers', data),
  update: (id, data) => api.put(`/api/suppliers/${id}`, data),
  delete: (id) => api.delete(`/api/suppliers/${id}`)
};

export const customerService = {
  getAll: () => api.get('/api/customers'),
  getById: (id) => api.get(`/api/customers/${id}`),
  create: (data) => api.post('/api/customers', data),
  update: (id, data) => api.put(`/api/customers/${id}`, data),
  delete: (id) => api.delete(`/api/customers/${id}`)
};

export const shoppingService = {
  getAll: () => api.get('/api/shopping'),
  getById: (id) => api.get(`/api/shopping/${id}`),
  create: (data) => api.post('/api/shopping', data),
  update: (id, data) => api.put(`/api/shopping/${id}`, data),
  delete: (id) => api.delete(`/api/shopping/${id}`)
};

export const analyticsService = {
  getAll: () => api.get('/api/analytics'),
  getById: (id) => api.get(`/api/analytics/${id}`),
  create: (data) => api.post('/api/analytics', data),
  update: (id, data) => api.put(`/api/analytics/${id}`, data),
  delete: (id) => api.delete(`/api/analytics/${id}`)
};

export const financeService = {
  getAll: () => api.get('/api/finance'),
  getById: (id) => api.get(`/api/finance/${id}`),
  create: (data) => api.post('/api/finance', data),
  update: (id, data) => api.put(`/api/finance/${id}`, data),
  delete: (id) => api.delete(`/api/finance/${id}`)
};

// Stock Management Services
export const stockService = {
  getAll: () => api.get('/api/stock'),
  getById: (id) => api.get(`/api/stock/${id}`),
  create: (data) => api.post('/api/stock', data),
  update: (id, data) => api.put(`/api/stock/${id}`, data),
  delete: (id) => api.delete(`/api/stock/${id}`),

  // Stock Movement
  getMovements: (params) => api.get('/api/stock/movements', { params }),
  createMovement: (data) => api.post('/api/stock/movements', data),
  updateMovement: (id, data) => api.put(`/api/stock/movements/${id}`, data),
  deleteMovement: (id) => api.delete(`/api/stock/movements/${id}`),

  // Ingredient Stock Management
  getIngredientStock: (ingredientId) => api.get(`/api/stock/ingredients/${ingredientId}`),
  updateIngredientStock: (ingredientId, data) => api.put(`/api/stock/ingredients/${ingredientId}`, data),
  getIngredientMovements: (ingredientId) => api.get(`/api/stock/ingredients/${ingredientId}/movements`),

  // Stock Reports
  getLowStockIngredients: () => api.get('/api/stock/reports/low-stock'),
  getStockValueReport: () => api.get('/api/stock/reports/value'),
  getMovementHistory: (params) => api.get('/api/stock/reports/movements', { params }),
};

// Ingredients Service
export const ingredientService = {
  getAll: () => api.get('/api/ingredients'),
  getById: (id) => api.get(`/api/ingredients/${id}`),
  create: (data) => api.post('/api/ingredients', data),
  update: (id, data) => api.put(`/api/ingredients/${id}`, data),
  delete: (id) => api.delete(`/api/ingredients/${id}`),

  // Additional ingredient-specific endpoints
  getBySupplier: (supplierId) => api.get(`/api/ingredients/supplier/${supplierId}`),
  getBelowReorderPoint: () => api.get('/api/ingredients/reorder'),
  updateStock: (id, quantity) => api.put(`/api/ingredients/${id}/stock`, { quantity }),
};

// Auth service with custom methods
export const authService = {
  login: async (credentials) => {
    const response = await api.post('/api/auth/login', credentials);
    if (response?.token) {
      localStorage.setItem('token', response.token);
    }
    return response;
  },
  logout: () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  },
  forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/api/auth/reset-password', { token, password }),
};

// Dashboard service with custom methods
export const dashboardService = {
  getStats: () => api.get('/api/dashboard/stats'),
  getRevenueStats: (period) => api.get(`/api/dashboard/stats/revenue/${period}`),
};

export default api;
