import axios from 'axios';

// Auto-append '/api' to VITE_API_URL if it is missing
let baseUrl = import.meta.env.VITE_API_URL || '/api';
if (baseUrl.startsWith('http') && !baseUrl.includes('/api')) {
  baseUrl = baseUrl.replace(/\/$/, '') + '/api';
}

// Base API instance
const API = axios.create({
  baseURL: baseUrl,
  timeout: 90000, // 90s timeout (especially for heavy FastAPI integrations and cold starts)
});

// Request Interceptor: Automatically inject JWT Token
API.interceptors.request.use(
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

// Response Interceptor: Handle JWT expirations (401s)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and reload to force routing back to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default API;
