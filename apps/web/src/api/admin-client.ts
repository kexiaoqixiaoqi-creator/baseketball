import axios from 'axios';

const base = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
export const adminClient = axios.create({
  baseURL: `${base}/admin`,
  headers: { 'Content-Type': 'application/json' },
});

adminClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

adminClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLoginRequest = err.config?.url?.includes('/auth/login');
    if (!isLoginRequest && (err.response?.status === 401 || err.response?.status === 403)) {
      localStorage.removeItem('admin_token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(err);
  },
);
