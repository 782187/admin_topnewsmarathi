import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
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

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  changePassword: (data) => api.post('/auth/change-password', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// Categories API
export const categoryAPI = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
};

// Cities API
export const cityAPI = {
  getAll: () => api.get('/cities'),
  create: (data) => api.post('/cities', data),
};

// Articles API
export const articleAPI = {
  getAll: (params) => api.get('/articles', { params }),
  getBreaking: (limit) => api.get('/articles/breaking', { params: { limit } }),
  getVideos: (limit) => api.get('/articles/videos', { params: { limit } }),
  getBySlug: (slug) => api.get(`/articles/${slug}`),
  getById: (id) => api.get(`/articles/${id}`),
  create: (formData) => api.post('/articles', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, formData) => api.put(`/articles/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/articles/${id}`),
};

// Ads API
export const adsAPI = {
  getAll: (params) => api.get('/ads', { params }),
  getActive: (params) => api.get('/ads/active', { params }),
  getById: (id) => api.get(`/ads/${id}`),
  create: (formData) => api.post('/ads', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, formData) => api.put(`/ads/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/ads/${id}`),
  toggleStatus: (id) => api.patch(`/ads/${id}/toggle`),
};

export default api;
