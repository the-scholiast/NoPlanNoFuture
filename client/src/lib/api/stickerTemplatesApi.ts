import { apiCall } from './client';

export interface StickerTemplate {
  id: string;
  emoji: string;
  name: string;
}

export const stickerTemplatesApi = {
  getTemplates: async (): Promise<StickerTemplate[]> => {
    return apiCall('/sticker-templates');
  },

  create: async (payload: { emoji: string; name: string }): Promise<StickerTemplate> => {
    return apiCall('/sticker-templates', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  update: async (
    id: string,
    payload: { emoji: string; name: string }
  ): Promise<StickerTemplate> => {
    return apiCall(`/sticker-templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  delete: async (id: string): Promise<{ success: boolean }> => {
    return apiCall(`/sticker-templates/${id}`, { method: 'DELETE' });
  },
};
