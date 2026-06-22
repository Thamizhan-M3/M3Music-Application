import axios from 'axios';
import useAuthStore from '../store/authStore';

const normalizeApiBaseUrl = (value) => {
  if (!value || value === '$VITE_API_URL') return '';

  const trimmed = value.trim().replace(/\/$/, '');

  if (!trimmed || trimmed === '/api') return '';
  if (trimmed.includes('m3music-m3-music-backend')) return '';

  return trimmed.replace(/\/api$/, '');
};

const axiosInstance = axios.create({
  baseURL: normalizeApiBaseUrl(window.__ENV__?.VITE_API_URL ?? import.meta.env.VITE_API_URL),
});

// Request interceptor to add the auth token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
