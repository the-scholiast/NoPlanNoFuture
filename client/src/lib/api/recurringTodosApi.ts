import { TaskData } from '@/types/todoTypes';
import { apiCall } from './client';

export const recurringTodoApi = {
  // Get today's tasks including recurring instances
  getTodayTasks: async (): Promise<TaskData[]> => {
    return apiCall('/recurring-todos/today');
  },

  // Get upcoming week tasks including recurring instances
  getUpcomingTasks: async (): Promise<TaskData[]> => {
    return apiCall('/recurring-todos/upcoming-week');
  },

  // Get tasks for a month including recurring instances
  getMonthTasks: async (year: number, month: number): Promise<TaskData[]> => {
    return apiCall(`/recurring-todos/month?year=${year}&month=${month}`);
  },
};