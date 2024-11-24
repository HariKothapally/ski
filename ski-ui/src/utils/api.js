import axios from 'axios';

const createApiService = (baseEndpoint) => {
  const baseURL = `${import.meta.env.VITE_API_URL}/api/${baseEndpoint}`;
  
  const api = axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json'
    },
    // Add timeout
    timeout: 10000,
  });

  // Request interceptor
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      console.error('Request error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (!error.response) {
        // Network error
        console.error('Network error:', error);
        return Promise.reject(new Error('Network error. Please check your connection.'));
      }

      if (error.response.status === 401) {
        // Unauthorized - clear auth data and redirect
        localStorage.removeItem('authToken');
        localStorage.removeItem('userInfo');
        window.location.href = '/login';
        return Promise.reject(new Error('Session expired. Please log in again.'));
      }

      if (error.response.status === 403) {
        // Forbidden - user doesn't have permission
        return Promise.reject(new Error('You do not have permission to perform this action.'));
      }

      if (error.response.status === 404) {
        // Not found
        return Promise.reject(new Error('The requested resource was not found.'));
      }

      if (error.response.status >= 500) {
        // Server error
        console.error('Server error:', error);
        return Promise.reject(new Error('An unexpected error occurred. Please try again later.'));
      }

      // Return original error for other cases
      return Promise.reject(error);
    }
  );

  return {
    getAll: (params) => api.get('/', { params }),
    getById: (id) => api.get(`/${id}`),
    create: (endpoint = '', data) => api.post(endpoint, data),
    update: (id, data) => api.put(`/${id}`, data),
    delete: (id) => api.delete(`/${id}`),
    custom: (method, endpoint, data = null, config = {}) => 
      api({ method, url: endpoint, data, ...config })
  };
};

export { createApiService };
