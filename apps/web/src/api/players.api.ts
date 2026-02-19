import { apiClient } from './client';

export const playersApi = {
  list: (params?: { position?: string; team?: string }) =>
    apiClient.get('/players', { params }).then((r) => r.data),

  get: (id: number) => apiClient.get(`/players/${id}`).then((r) => r.data),
};
