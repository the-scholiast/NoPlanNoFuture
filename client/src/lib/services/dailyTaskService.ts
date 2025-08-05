import { todoApi } from '@/lib/api/todos';
import { TaskData, CreateTaskData } from '@/types/todoTypes';

export class DailyTaskService {
  /**
   * Reset completed daily tasks back to incomplete for the new day
   * This should be called when the user opens the app on a new day
   * Only resets active (non-deleted) tasks
   */
  static async resetDailyTasks(userId: string): Promise<void> {
    try {
      // Use the dedicated API endpoint for resetting daily tasks
      // This ensures only active (non-deleted) tasks are reset
      await todoApi.resetDailyTasks();
    } catch (error) {
      console.error('Error resetting daily tasks:', error);
    }
  }

  /**
   * Complete a daily task and update completion statistics
   * Only works on active (non-deleted) tasks
   */
  static async completeDailyTask(taskId: string): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const task = await todoApi.get(taskId);
      
      // Ensure task exists and is not deleted
      if (task.section === 'daily' && !task.deleted_at) {
        await todoApi.update(taskId, {
          completed: true,
          completed_at: new Date().toISOString(),
          completion_count: (task.completion_count || 0) + 1,
          last_completed_date: today,
        });
      }
    } catch (error) {
      console.error('Error completing daily task:', error);
    }
  }

  /**
   * Get completion statistics for daily tasks
   * Only includes active (non-deleted) tasks
   */
  static async getDailyTaskStats(dateRange?: { start: string; end: string }) {
    try {
      return await todoApi.getDailyTaskStats(dateRange?.start, dateRange?.end);
    } catch (error) {
      console.error('Error getting daily task stats:', error);
      return [];
    }
  }

  /**
   * Soft delete a task (move to trash)
   */
  static async deleteTask(taskId: string): Promise<void> {
    try {
      await todoApi.delete(taskId);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  }

  /**
   * Restore a task from trash
   */
  static async restoreTask(taskId: string): Promise<void> {
    try {
      await todoApi.restore(taskId);
    } catch (error) {
      console.error('Error restoring task:', error);
    }
  }

  /**
   * Get deleted tasks (for trash view)
   */
  static async getDeletedTasks(limit = 50): Promise<TaskData[]> {
    try {
      return await todoApi.getDeleted(limit);
    } catch (error) {
      console.error('Error getting deleted tasks:', error);
      return [];
    }
  }

  /**
   * Cleanup old deleted tasks (permanent deletion)
   */
  static async cleanupOldTasks(daysOld = 30): Promise<void> {
    try {
      await todoApi.cleanupOldDeleted(daysOld);
    } catch (error) {
      console.error('Error cleaning up old tasks:', error);
    }
  }

  /**
   * Check if daily tasks need to be reset based on last app open
   * Uses sessionStorage instead of localStorage for better cleanup
   */
  static shouldResetDailyTasks(): boolean {
    const lastAppOpen = sessionStorage.getItem('lastAppOpen');
    const today = new Date().toISOString().split('T')[0];
    
    if (!lastAppOpen) {
      sessionStorage.setItem('lastAppOpen', today);
      return false;
    }
    
    if (lastAppOpen !== today) {
      sessionStorage.setItem('lastAppOpen', today);
      return true;
    }
    
    return false;
  }
}