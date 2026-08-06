import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Use your machine's LAN IP when testing on a physical device, e.g. http://192.168.x.x:5000/api
// For Android emulator use http://10.0.2.2:5000/api
const BASE_URL = 'http://localhost:5000/api';
const TOKEN_KEY = 'his_inks_token';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// ── Request interceptor: attach stored Bearer token ───────────────────────────
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
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
      error.message ||
      'Something went wrong. Please try again.';
    return Promise.reject(new Error(message));
  }
);

export { TOKEN_KEY };
export default api;
