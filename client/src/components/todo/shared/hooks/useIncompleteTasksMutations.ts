import { useMutation } from '@tanstack/react-query';
import { todoApi } from '@/lib/api/todos';
import { TaskData } from '@/types/todoTypes';
import { getTodayString, formatDateString } from '@/lib/utils/dateUtils';
import { todoCompletionsApi } from '@/lib/api/todoCompletions';
import { useDataRefresh } from './useDataRefresh';

// Mutations specifically for IncompleteTasks component operations
export const useIncompleteTasksMutations = () => {
  const { refreshAllData } = useDataRefresh();

  // Complete task mutation - marks an incomplete task as complete
  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const task = await todoApi.get(taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      const today = getTodayString();
      const now = formatDateString(new Date());

      // Create completion record for CompletedTasks component
      const originalTaskId = taskId.includes('_') ? taskId.split('_')[0] : taskId;
      try {
        await todoCompletionsApi.createCompletion(originalTaskId, today);
      } catch (completionError) {
        console.error('Failed to create completion record:', completionError);
        // Continue with task update even if completion record fails
      }

      // Update the task status directly
      const updates: Partial<TaskData> = {
        completed: true,
        completed_at: now,
      };

      updates.completion_count = (task.completion_count || 0) + 1;
      if (task.section === 'daily') {
        updates.last_completed_date = today;
      }

      await todoApi.update(taskId, updates);
    },
    onSuccess: refreshAllData,
  });

  // Soft delete by setting deleted_at timestamp
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const now = getTodayString();
      await todoApi.update(taskId, { deleted_at: now });
    },
    onSuccess: refreshAllData,
  });

  // Bulk complete tasks mutation
  const bulkCompleteTasksMutation = useMutation({
    mutationFn: async (taskIds: string[]) => {
      const today = getTodayString();
      const now = getTodayString();

      const results = await Promise.all(
        taskIds.map(async (taskId) => {
          const task = await todoApi.get(taskId);
          if (!task) return null;

          // Update task status directly
          const updates: Partial<TaskData> = {
            completed: true,
            completed_at: now,
          };

          if (task.section === 'daily') {
            updates.completion_count = (task.completion_count || 0) + 1;
            updates.last_completed_date = today;
          }

          return todoApi.update(taskId, updates);
        })
      );

      return results.filter(Boolean);
    },
    onSuccess: refreshAllData,
  });

  // Bulk delete tasks mutation
  const bulkDeleteTasksMutation = useMutation({
    mutationFn: async (taskIds: string[]) => {
      const now = getTodayString();

      const results = await Promise.all(
        taskIds.map(taskId => todoApi.update(taskId, { deleted_at: now }))
      );

      return results;
    },
    onSuccess: refreshAllData,
  });

  // Update task dates mutation
  const updateTaskDatesMutation = useMutation({
    mutationFn: async ({
      taskId,
      startDate,
      endDate
    }: {
      taskId: string;
      startDate?: string;
      endDate?: string;
    }) => {
      const updates: Partial<TaskData> = {};

      if (startDate !== undefined) updates.start_date = startDate;
      if (endDate !== undefined) updates.end_date = endDate;

      return todoApi.update(taskId, updates);
    },
    onSuccess: refreshAllData,
  });

  return {
    completeTaskMutation,
    deleteTaskMutation,
    bulkCompleteTasksMutation,
    bulkDeleteTasksMutation,
    updateTaskDatesMutation,
  };
};