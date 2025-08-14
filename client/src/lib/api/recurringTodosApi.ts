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

  // Update recurring pattern for a task
  updateRecurringPattern: async (taskId: string, recurringDays: string[]): Promise<TaskData> => {
    return apiCall(`/recurring-todos/${taskId}/pattern`, {
      method: 'PATCH',
      body: JSON.stringify({ recurringDays }),
    });
  },

  // Generate instances for a specific task and date range
  generateInstances: async (
    taskId: string, 
    startDate: string, 
    endDate: string
  ): Promise<TaskData[]> => {
    return apiCall('/recurring-todos/generate-instances', {
      method: 'POST',
      body: JSON.stringify({ taskId, startDate, endDate }),
    });
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

  // Validate recurring days (client-side helper)
  validateRecurringDays: (days: string[]): { isValid: boolean; errors: string[] } => {
    const validDays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const errors: string[] = [];
    
    if (!Array.isArray(days)) {
      errors.push('Recurring days must be an array');
      return { isValid: false, errors };
    }

    for (const day of days) {
      if (typeof day !== 'string') {
        errors.push(`Day must be a string: ${day}`);
        continue;
      }
      
      if (!validDays.includes(day.toLowerCase())) {
        errors.push(`Invalid day name: ${day}`);
      }
    }

    if (days.length === 0) {
      errors.push('At least one day must be selected for recurring tasks');
    }

    return { isValid: errors.length === 0, errors };
  },

  // Get human-readable description of recurring pattern (UI helper)
  getRecurringDescription: (task: TaskData): string => {
    if (!task.is_recurring || !task.recurring_days) {
      return 'Not recurring';
    }

    const days = task.recurring_days;
    const dayNames = days.map(day => day.charAt(0).toUpperCase() + day.slice(1));

    if (days.length === 7) {
      return 'Every day';
    }

    if (days.length === 5 && !days.includes('saturday') && !days.includes('sunday')) {
      return 'Weekdays only';
    }

    if (days.length === 2 && days.includes('saturday') && days.includes('sunday')) {
      return 'Weekends only';
    }

    if (days.length <= 3) {
      return dayNames.join(', ');
    }

    return `${days.length} days per week`;
  },
};