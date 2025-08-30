import { apiCall } from './client';
import { todoCompletionsApi } from './todoCompletions';

export const todoStatsApi = {
  // Get daily task statistics - Change any when actually using api call
  // getDailyTaskStats: async (startDate?: string, endDate?: string): Promise<any[]> => {
  //   const params = new URLSearchParams();
  //   if (startDate) params.append('startDate', startDate);
  //   if (endDate) params.append('endDate', endDate);

  //   const query = params.toString() ? `?${params.toString()}` : '';
  //   return apiCall(`/todos/daily/stats${query}`);
  // },

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

  // Get completion statistics for a task
  getTaskCompletionStats: async (taskId: string): Promise<{
    totalCompletions: number;
    firstCompletion: string | null;
    lastCompletion: string | null;
    completionDates: string[];
  }> => {
    try {
      const completions = await todoCompletionsApi.getTaskCompletions(taskId);

      if (completions.length === 0) {
        return {
          totalCompletions: 0,
          firstCompletion: null,
          lastCompletion: null,
          completionDates: []
        };
      }

      const sortedCompletions = completions.sort((a, b) =>
        new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
      );

      return {
        totalCompletions: completions.length,
        firstCompletion: sortedCompletions[0].completed_at,
        lastCompletion: sortedCompletions[sortedCompletions.length - 1].completed_at,
        completionDates: completions.map(c => c.instance_date)
      };
    } catch (error) {
      console.error('todoCompletionsApi: Error getting task completion stats:', error);
      return {
        totalCompletions: 0,
        firstCompletion: null,
        lastCompletion: null,
        completionDates: []
      };
    }
  },
}