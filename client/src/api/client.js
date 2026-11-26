import axios from 'axios';

export const TOKEN_KEY = 'resumeai_token';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', timeout: 90000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Expired / invalid session on an admin call -> drop token and let AuthContext redirect
    const isAuthCall = err.config?.url?.startsWith('/auth/login') || err.config?.url?.startsWith('/auth/register');
    if (err.response?.status === 401 && !isAuthCall && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event('auth:expired'));
    }
    return Promise.reject(err);
  }
);

export const errorMessage = (err, fallback = 'Something went wrong. Please try again.') => {
  if (err.code === 'ECONNABORTED') return 'The request timed out. Please try again.';
  if (!err.response) return 'Cannot reach the server. Check that the API is running.';
  return err.response.data?.message || fallback;
};

export default api;
