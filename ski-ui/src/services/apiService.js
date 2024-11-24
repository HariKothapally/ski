import axios from 'axios';
import { getBaseConfig, handleApiError } from './config';

const createApiService = (resource) => {
  const baseConfig = getBaseConfig();
  const api = axios.create(baseConfig);

  return {
    getAll: async (params = {}) => {
      try {
        const response = await api.get(`/api/${resource}`, { params });
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    },

    getById: async (id) => {
      try {
        const response = await api.get(`/api/${resource}/${id}`);
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    },

    create: async (data) => {
      try {
        const response = await api.post(`/api/${resource}`, data);
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    },

    update: async (id, data) => {
      try {
        const response = await api.put(`/api/${resource}/${id}`, data);
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    },

    delete: async (id) => {
      try {
        const response = await api.delete(`/api/${resource}/${id}`);
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    },

    // Custom request method for special endpoints
    custom: async (method, endpoint, data = null, config = {}) => {
      try {
        const response = await api({
          method,
          url: `/api/${resource}${endpoint}`,
          data,
          ...config,
        });
        return response.data;
      } catch (error) {
        handleApiError(error);
      }
    },
  };
};

export default createApiService;
