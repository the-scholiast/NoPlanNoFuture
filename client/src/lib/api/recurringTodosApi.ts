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

  // Get statistics for a recurring task
  getTaskStats: async (
    taskId: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<{
    taskId: string;
    taskTitle: string;
    recurringDays: string[];
    dateRange: { start: string; end: string };
    statistics: {
      totalPossibleOccurrences: number;
      completedOccurrences: number;
      completionRate: number;
      averagePerWeek: number;
    };
  }> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiCall(`/recurring-todos/stats/${taskId}${query}`);
  },
};