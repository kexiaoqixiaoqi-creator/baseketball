import { apiClient } from './client';

export const authApi = {
  register: (data: { username: string; email: string; password: string }) =>
    apiClient.post('/auth/register', data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    apiClient.post('/auth/login', data).then((r) => r.data),

  me: () => apiClient.get('/auth/me').then((r) => r.data),
};
