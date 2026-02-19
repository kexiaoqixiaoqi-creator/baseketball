import { apiClient } from './client';

export const lineupsApi = {
  create: (data: {
    gameDayId: number;
    roomId: number;
    pgId: number;
    sgId: number;
    sfId: number;
    pfId: number;
    cId: number;
  }) => apiClient.post('/lineups', data).then((r) => r.data),

  my: (gameDayId: number, roomId: number) =>
    apiClient.get('/lineups/my', { params: { gameDayId, roomId } }).then((r) => r.data),

  history: () => apiClient.get('/lineups/history').then((r) => r.data),
};
