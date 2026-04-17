import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.buscaycurra.es/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

// Interceptor para añadir token automáticamente
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const auth = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// CV
export const cv = {
  create: (data) => api.post('/cv', data),
  list: () => api.get('/cv'),
  get: (id) => api.get(`/cv/${id}`),
  pdfUrl: (id) => `${API_URL}/cv/${id}/pdf`,
};

// Jobs (Tablón)
export const jobs = {
  list: (params) => api.get('/jobs', { params }),
  get: (id) => api.get(`/jobs/${id}`),
  save: (id) => api.post(`/jobs/${id}/save`),
  saved: () => api.get('/jobs/saved/list'),
};

// Applications
export const applications = {
  send: (data) => api.post('/applications', data),
  history: (params) => api.get('/applications', { params }),
};

export default api;
