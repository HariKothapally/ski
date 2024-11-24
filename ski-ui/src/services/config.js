// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Other configuration constants
export const API_TIMEOUT = 30000; // 30 seconds
export const DEFAULT_PAGE_SIZE = 10;

// Auth configuration
export const TOKEN_KEY = 'token';
export const REFRESH_TOKEN_KEY = 'refresh_token';

// Feature flags
export const FEATURES = {
  ENABLE_ANALYTICS: true,
  ENABLE_NOTIFICATIONS: true,
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Unauthorized access. Please login again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  NOT_FOUND: 'Resource not found.',
};

export const getAuthToken = () => localStorage.getItem(TOKEN_KEY);

export const getBaseConfig = () => ({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    ...(getAuthToken() && { Authorization: `Bearer ${getAuthToken()}` }),
  },
});

export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    const message = error.response.data?.message || ERROR_MESSAGES.SERVER_ERROR;
    if (error.response.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = '/login';
    }
    throw new Error(message);
  } else if (error.request) {
    // Request made but no response
    throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
  } else {
    // Other errors
    throw new Error(ERROR_MESSAGES.SERVER_ERROR);
  }
};

export default {
  API_BASE_URL,
  API_TIMEOUT,
  DEFAULT_PAGE_SIZE,
  TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  FEATURES,
  ERROR_MESSAGES,
};
