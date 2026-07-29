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
  getById: (id) => api.get(`/articles/id/${id}`),
  create: (formData) => api.post('/articles', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, formData) => api.put(`/articles/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/articles/${id}`),
};

// Authors API
export const authorAPI = {
  getAll: () => api.get('/authors'),
  create: (formData) => api.post('/authors', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update: (id, formData) => api.put(`/authors/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  delete: (id) => api.delete(`/authors/${id}`),
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

// E-Paper API
export const epaperAPI = {
  // Editions
  getEditions: () => api.get('/epapers/editions'),
  createEdition: (data) => api.post('/epapers/editions', data),
  updateEdition: (id, data) => api.put(`/epapers/editions/${id}`, data),
  deleteEdition: (id) => api.delete(`/epapers/editions/${id}`),

  // Issues
  getAll: (params) => api.get('/epapers', { params }),
  getById: (id) => api.get(`/epapers/${id}`),
  create: (formData, onUploadProgress) => api.post('/epapers', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  }),
  update: (id, formData, onUploadProgress) => api.put(`/epapers/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  }),
  delete: (id) => api.delete(`/epapers/${id}`),

  // Page rendering (Phase 0) + clickable sections (Phase 1)
  renderPages: (id) => api.post(`/epapers/${id}/render-pages`),
  getEditor: (id) => api.get(`/epapers/${id}/editor`),
  createArticle: (id, data) => api.post(`/epapers/${id}/articles`, data),
  updateArticle: (articleId, data) => api.put(`/epaper-articles/${articleId}`, data),
  deleteArticle: (articleId) => api.delete(`/epaper-articles/${articleId}`),
  autoDetectSections: (id, pageNumber) => api.post(`/epapers/${id}/pages/${pageNumber}/auto-detect`),
  clearPageSections: (id, pageNumber) => api.delete(`/epapers/${id}/pages/${pageNumber}/articles`),
  mergeSections: (id, articleIds) => api.post(`/epapers/${id}/articles/merge`, { article_ids: articleIds }),
};

export default api;
