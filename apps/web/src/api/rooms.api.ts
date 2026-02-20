import { apiClient } from './client';

export const roomsApi = {
  list: () => apiClient.get('/rooms').then((r) => r.data),
  official: () => apiClient.get('/rooms/official').then((r) => r.data),

  get: (id: number) => apiClient.get(`/rooms/${id}`).then((r) => r.data),

  create: (data: { name: string; salaryCapCoefficient?: number; ptsWeight?: number; rebWeight?: number; astWeight?: number; stlWeight?: number; blkWeight?: number; toWeight?: number }) =>
    apiClient.post('/rooms', data).then((r) => r.data),

  join: (id: number) => apiClient.post(`/rooms/${id}/join`).then((r) => r.data),

  rankings: (id: number, gameDayId: number) =>
    apiClient.get(`/rooms/${id}/rankings`, { params: { gameDayId } }).then((r) => r.data),
};
