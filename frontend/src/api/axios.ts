import axios from 'axios';

export const TOKEN_KEY = 'token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Attach the token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the token is expired or invalid, remove it
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthCall = error.config?.url?.startsWith('/auth/login');
    if (error.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem(TOKEN_KEY);
    }
    return Promise.reject(error);
  },
);

export default api;