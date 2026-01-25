import { apiCall } from './client';

export interface DaySticker {
  id: string;
  date: string;
  emoji: string;
  name: string;
}

export const dayStickersApi = {
  getMonthStickers: async (year: number, month: number): Promise<DaySticker[]> => {
    return apiCall(`/day-stickers/month?year=${year}&month=${month}`);
  },

  createSticker: async (
    date: string,
    payload: { emoji: string; name: string }
  ): Promise<DaySticker> => {
    return apiCall(`/day-stickers`, {
      method: 'POST',
      body: JSON.stringify({ date, ...payload }),
    });
  },

  updateSticker: async (
    id: string,
    payload: { emoji: string; name: string }
  ): Promise<DaySticker> => {
    return apiCall(`/day-stickers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  deleteSticker: async (id: string): Promise<{ success: boolean }> => {
    return apiCall(`/day-stickers/${id}`, { method: 'DELETE' });
  },
};
