import { apiCall } from './client';
import { TodoCompletion } from '@/components/todo';
import { TaskData } from '@/types/todoTypes';

export interface CompletedTaskWithDetails extends TaskData {
  task_id: string;
  instance_date: string;
  completion: TodoCompletion;
  completion_count: number;
}

export const todoCompletionsApi = {
  // Get all completed tasks with their completion details
  async getCompletedTasks(dateRange?: { start: string; end: string }): Promise<CompletedTaskWithDetails[]> {
    try {
      let endpoint = '/todos/completions';
      if (dateRange) {
        endpoint += `?startDate=${dateRange.start}&endDate=${dateRange.end}`;
      }
      const data = await apiCall(endpoint);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('todoCompletionsApi: Error fetching completed tasks:', error);
      throw error;
    }
  },

  // Create a new completion record
  async createCompletion(taskId: string, instanceDate: string): Promise<TodoCompletion> {
    try {
      const data = await apiCall('/todos/completions', {
        method: 'POST',
        body: JSON.stringify({
          task_id: taskId,
          instance_date: instanceDate
        })
      });
      return data;
    } catch (error) {
      console.error('todoCompletionsApi: Error creating completion:', error);
      throw error;
    }
  },

  // Delete a completion by task and date 
  async deleteCompletionByTaskAndDate(taskId: string, instanceDate: string): Promise<void> {
    try {
      await apiCall(`/todos/completions/task/${taskId}/date/${instanceDate}`, {
        method: 'DELETE'
      });
      console.log('todoCompletionsApi: Completion deleted');
    } catch (error) {
      console.error('todoCompletionsApi: Error deleting completion:', error);
      throw error;
    }
  },

  // Helper method to get completions for a specific task and date
  async getCompletionsForTaskAndDate(taskId: string, instanceDate: string): Promise<TodoCompletion[]> {
    try {
      // Get completions with proper date filtering
      const data = await apiCall(`/todos/completions?startDate=${instanceDate}&endDate=${instanceDate}`);
      const filtered = Array.isArray(data) ? data.filter(item =>
        item.task_id === taskId && item.instance_date === instanceDate
      ) : [];

      return filtered.map(item => item.completion);
    } catch (error) {
      console.error('todoCompletionsApi: Error getting completions for task and date:', error);
      return [];
    }
  },

  // Delete a specific completion by ID (fallback to task/date method)
  async deleteCompletion(completionId: string): Promise<void> {
    try {
      // Get all completed tasks to find the one with this completion ID
      const allCompleted = await this.getCompletedTasks();
      const targetCompletion = allCompleted.find(item => item.completion.id === completionId);

      if (targetCompletion) {
        await this.deleteCompletionByTaskAndDate(
          targetCompletion.task_id,
          targetCompletion.instance_date
        );
      } else {
        console.warn('todoCompletionsApi: Completion not found for ID:', completionId);
      }
    } catch (error) {
      console.error('todoCompletionsApi: Error deleting completion by ID:', error);
      throw error;
    }
  },

  // Get a specific completion by ID
  async getCompletion(completionId: string): Promise<TodoCompletion | null> {
    try {
      const allCompleted = await this.getCompletedTasks();
      const targetCompletion = allCompleted.find(item => item.completion.id === completionId);
      return targetCompletion ? targetCompletion.completion : null;
    } catch (error) {
      console.error('todoCompletionsApi: Error getting completion by ID:', error);
      return null;
    }
  },

  // Get all completions for a specific task
  async getTaskCompletions(taskId: string): Promise<TodoCompletion[]> {
    try {
      const data = await apiCall('/todos/completions');
      const filtered = Array.isArray(data) ? data.filter(item => item.task_id === taskId) : [];
      return filtered.map(item => item.completion);
    } catch (error) {
      console.error('todoCompletionsApi: Error getting task completions:', error);
      return [];
    }
  },

  // Get completion statistics for a task
  async getTaskCompletionStats(taskId: string): Promise<{
    totalCompletions: number;
    firstCompletion: string | null;
    lastCompletion: string | null;
    completionDates: string[];
  }> {
    try {
      const completions = await this.getTaskCompletions(taskId);

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
};