import { TaskData } from '@/types/todoTypes';
import { apiCall } from './client';
import { getTodayString } from '../utils/dateUtils';
import type { TaskOverride, TaskOverrideData } from '@/types/todoTypes';

export const recurringTodoApi = {
  // Get today's tasks 
  getTodayTasks: async (): Promise<TaskData[]> => {
    const today = getTodayString();
    return apiCall(`/recurring-todos/today?date=${today}`);
  },

  // Get tasks for a month including recurring instances
  getMonthTasks: async (year: number, month: number): Promise<TaskData[]> => {
    return apiCall(`/recurring-todos/month?year=${year}&month=${month}`);
  },

  // Get override for a specific task instance
  getOverride: async (parentTaskId: string, instanceDate: string): Promise<TaskOverride | null> => {
    return apiCall(`/recurring-todos/${parentTaskId}/${instanceDate}`);
  },

  // Get all overrides for a parent task
  getOverrides: async (parentTaskId: string): Promise<TaskOverride[]> => {
    return apiCall(`/recurring-todos/${parentTaskId}`);
  },

  // Create or update an override for a specific task instance
  createOrUpdateOverride: async (
    parentTaskId: string,
    instanceDate: string,
    overrideData: TaskOverrideData
  ): Promise<TaskOverride> => {
    return apiCall(`/recurring-todos/${parentTaskId}/${instanceDate}`, {
      method: 'PUT',
      body: JSON.stringify(overrideData),
    });
  },

  // Delete an override for a specific task instance
  deleteOverride: async (parentTaskId: string, instanceDate: string): Promise<{ success: boolean }> => {
    return apiCall(`/recurring-todos/${parentTaskId}/${instanceDate}`, {
      method: 'DELETE',
    });
  },
};