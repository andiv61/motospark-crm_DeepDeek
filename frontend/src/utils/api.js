import axios from 'axios';
import { message } from 'antd';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 10000
});

// Перехватчик запросов
api.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Перехватчик ответов
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      message.error('Session expired. Please login again.');
      localStorage.removeItem('authToken');
      window.location = '/login';
    } else {
      message.error(error.response?.data?.error || 'Request failed');
    }
    return Promise.reject(error);
  }
);

export default api;