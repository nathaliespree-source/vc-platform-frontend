import axios from 'axios';

const API_URL = 'https://joyful-reflection-production-1049.up.railway.app/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const auth = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

export const jobs = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/jobs?${params}`);
    return response.data;
  },
  getById: async (id) => {
    const response = await api.get(`/jobs/${id}`);
    return response.data;
  },
  create: async (jobData) => {
    const response = await api.post('/jobs', jobData);
    return response.data;
  },
  getStats: async () => {
    const response = await api.get('/jobs/stats/overview');
    return response.data;
  }
};

export const recommendations = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/recommendations?${params}`);
    return response.data;
  },
  create: async (data) => {
    const response = await api.post('/recommendations', data);
    return response.data;
  },
  submit: async (id) => {
    const response = await api.post(`/recommendations/${id}/submit`);
    return response.data;
  },
  addFeedback: async (id, data) => {
    const response = await api.post(`/recommendations/${id}/feedback`, data);
    return response.data;
  }
};

export default api;
