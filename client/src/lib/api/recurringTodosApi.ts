import { TaskData } from '@/types/todoTypes';
import { apiCall } from './client';
import { todayNoonUTC } from '../utils/dateUtils';

export const recurringTodoApi = {
  // Get today's tasks including recurring instances
  getTodayTasks: async (): Promise<TaskData[]> => {
    const today = todayNoonUTC();
    return apiCall(`/recurring-todos/today?date=${today}`);
  },

  // Get tasks for a month including recurring instances
  getMonthTasks: async (year: number, month: number): Promise<TaskData[]> => {
    return apiCall(`/recurring-todos/month?year=${year}&month=${month}`);
  },
};