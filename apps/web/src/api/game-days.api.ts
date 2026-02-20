import { apiClient } from './client';

export const gameDaysApi = {
  current: () => apiClient.get('/game-days/current').then((r) => r.data),

  get: (id: number) => apiClient.get(`/game-days/${id}`).then((r) => r.data),

  list: () => apiClient.get('/game-days').then((r) => r.data),

  players: (gameDayId: number, roomId?: number) =>
    apiClient
      .get(`/game-days/${gameDayId}/players`, { params: roomId ? { roomId } : undefined })
      .then((r) => r.data),
};
