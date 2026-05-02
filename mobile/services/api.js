import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Base URL ─────────────────────────────────────────────────────────────
import Constants from 'expo-constants';

// In production (EAS build) → always use hosted Render backend
// In Expo Go (dev)          → auto-detect local machine IP
const RENDER_URL = 'https://techline-backend.onrender.com'; // ← update after Render deploy

let BASE_URL = RENDER_URL;

if (__DEV__) {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    BASE_URL = `http://${ip}:5000`;
  }
}

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request Interceptor — Attach JWT token ────────────────────────────────
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('techline_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor — Handle global errors ────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — clear storage
      await AsyncStorage.removeItem('techline_token');
      await AsyncStorage.removeItem('techline_user');
    }
    return Promise.reject(error);
  }
);

export default api;
