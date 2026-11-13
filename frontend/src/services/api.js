import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject Authorization Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('school_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle unauthenticated 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired or invalid, clear local storage and redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('school_token');
        localStorage.removeItem('school_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
