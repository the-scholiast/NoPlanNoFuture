import { useMutation } from '@tanstack/react-query';
import { todoApi } from '@/lib/api/todos';
import { todoCompletionsApi } from '@/lib/api/todoCompletions';
import { TaskData } from '@/types/todoTypes';
import { getTodayString } from '@/lib/utils/dateUtils';
import { useDataRefresh } from './useDataRefresh';

// Mutations specifically for CompletedTasks component operations
export const useCompletedTasksMutations = () => {
  const { refreshAllData } = useDataRefresh();

  // Uncomplete task mutation - deletes the specific completion record
  const uncompleteTaskMutation = useMutation({
    mutationFn: async (completionId: string) => {
      // First, get the completion details to know which task it belongs to
      const completion = await todoCompletionsApi.getCompletion(completionId);
      if (!completion) {
        throw new Error('Completion not found');
      }

      // Delete the specific completion record
      await todoCompletionsApi.deleteCompletion(completionId);

      // Now check if this task has any remaining completions for today
      const today = getTodayString()
      const todayCompletions = await todoCompletionsApi.getCompletionsForTaskAndDate(
        completion.task_id,
        today
      );

      // Get the current task to update its status
      const task = await todoApi.get(completion.task_id);

      // If no more completions for today, update task status
      if (todayCompletions.length === 0) {
        const updates: Partial<TaskData> = {
          completed: false,
          completed_at: undefined,
        };

        // For daily tasks, also decrement completion count
        if (task.section === 'daily') {
          updates.completion_count = Math.max((task.completion_count || 1) - 1, 0);
          // Clear last_completed_date only if completion_count becomes 0
          if (updates.completion_count === 0) {
            updates.last_completed_date = undefined;
          }
        }

        await todoApi.update(completion.task_id, updates);
      }

      return { completionId, taskId: completion.task_id };
    },
    onSuccess: refreshAllData,
  });

  // Delete entire task mutation - deletes task and all its completions
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      // Delete all completions for this task first then delete the task itself
      return todoApi.delete(taskId);
    },
    onSuccess: refreshAllData,
  });

  // Complete task mutation - creates a new completion record
  const completeTaskMutation = useMutation({
    mutationFn: async ({ taskId, instanceDate }: { taskId: string; instanceDate: string }) => {
      // Create a completion record
      await todoCompletionsApi.createCompletion(taskId, instanceDate);

      // Get the task to determine how to update it
      const task = await todoApi.get(taskId);

      // Update the task status
      const updates: Partial<TaskData> = {
        completed: true,
        completed_at: getTodayString(),
      };

      updates.completion_count = (task.completion_count || 0) + 1;
      if (task.section === 'daily') {
        updates.last_completed_date = instanceDate;
      }

      await todoApi.update(taskId, updates);
    },
    onSuccess: refreshAllData,
  });

  // Bulk operations for completed tasks
  const bulkDeleteCompletionsMutation = useMutation({
    mutationFn: async (completionIds: string[]) => {
      // Delete multiple completion records
      const results = await Promise.all(
        completionIds.map(id => todoCompletionsApi.deleteCompletion(id))
      );

      // For each affected task, check if it needs to be marked as incomplete
      const today = getTodayString();
      const affectedTasks = new Set<string>();

      // Get all completion details to know which tasks were affected
      for (const completionId of completionIds) {
        try {
          const completion = await todoCompletionsApi.getCompletion(completionId);
          if (completion) {
            affectedTasks.add(completion.task_id);
          }
        } catch (error) {
          // Completion might already be deleted, that's okay
        }
      }

      // Update each affected task if needed
      for (const taskId of affectedTasks) {
        const todayCompletions = await todoCompletionsApi.getCompletionsForTaskAndDate(taskId, today);

        if (todayCompletions.length === 0) {
          const task = await todoApi.get(taskId);
          const updates: Partial<TaskData> = {
            completed: false,
            completed_at: undefined,
          };

          if (task.section === 'daily') {
            updates.completion_count = Math.max((task.completion_count || 1) - 1, 0);
            if (updates.completion_count === 0) {
              updates.last_completed_date = undefined;
            }
          }

          await todoApi.update(taskId, updates);
        }
      }

      return results;
    },
    onSuccess: refreshAllData,
  });

  // Delete all completions for a task
  const deleteAllTaskCompletionsMutation = useMutation({
    mutationFn: async (taskId: string) => {
      // Delete all completions for the task
      await todoCompletionsApi.deleteAllTaskCompletions(taskId);

      // Mark the task as incomplete
      const task = await todoApi.get(taskId);
      const updates: Partial<TaskData> = {
        completed: false,
        completed_at: undefined,
      };

      if (task.section === 'daily') {
        updates.completion_count = 0;
        updates.last_completed_date = undefined;
      }

      await todoApi.update(taskId, updates);
    },
    onSuccess: refreshAllData,
  });

  return {
    uncompleteTaskMutation,
    deleteTaskMutation,
    completeTaskMutation,
    bulkDeleteCompletionsMutation,
    deleteAllTaskCompletionsMutation,
  };
}