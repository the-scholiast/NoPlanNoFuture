import { TaskData, CreateTaskData } from '@/types/todoTypes';
import { apiCall } from './client';

export const todoApi = {
  // Fetch all todos from the API
  getAll: async (): Promise<TaskData[]> => {
    return apiCall('/todos/all');
  },

  // Fetch incomplete todos
  getIncomplete: async (): Promise<TaskData[]> => {
    return apiCall('/todos/incomplete');
  },

  // Get a single todo by ID
  get: async (id: string): Promise<TaskData> => {
    return apiCall(`/todos/${id}`);
  },

  // Create a new todo
  create: async (todoData: CreateTaskData): Promise<TaskData> => {
    return apiCall('/todos', {
      method: 'POST',
      body: JSON.stringify(todoData),
    });
  },

  // Update a todo
  update: async (id: string, updates: Partial<TaskData>): Promise<TaskData> => {
    return apiCall(`/todos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  // Soft delete a todo
  softDelete: async (id: string): Promise<TaskData> => {
    return apiCall(`/todos/${id}/soft-delete`, {
      method: 'DELETE',
    });
  },

  // Restore a soft deleted todo
  restore: async (id: string): Promise<TaskData> => {
    return apiCall(`/todos/${id}/restore`, {
      method: 'PATCH',
    });
  },

  // Get deleted todos (trash)
  getDeleted: async (limit = 50): Promise<TaskData[]> => {
    return apiCall(`/todos/deleted?limit=${limit}`);
  },

  // Permanently delete a todo
  permanentDelete: async (id: string): Promise<void> => {
    return apiCall(`/todos/${id}/permanent`, {
      method: 'DELETE',
    });
  },

  // Cleanup old deleted todos
  cleanupOldDeleted: async (daysOld = 30): Promise<TaskData[]> => {
    return apiCall(`/todos/cleanup/old?days=${daysOld}`, {
      method: 'DELETE',
    });
  },

  // Reset daily tasks
  resetDailyTasks: async (): Promise<TaskData[]> => {
    return apiCall('/todos/daily/reset', {
      method: 'POST',
    });
  },

  // Get daily task statistics
  getDailyTaskStats: async (startDate?: string, endDate?: string): Promise<any[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiCall(`/todos/daily/stats${query}`);
  },
};