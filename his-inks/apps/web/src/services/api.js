import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send httpOnly cookies automatically
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor: attach Bearer token if stored ────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('his_inks_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: normalise error shape ───────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.errors ||
      error.message ||
      'Something went wrong. Please try again.';
    return Promise.reject(typeof message === 'string' ? new Error(message) : message);
  }
);

export default api;
