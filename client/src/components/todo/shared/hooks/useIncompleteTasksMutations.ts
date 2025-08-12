import { useMutation, useQueryClient } from '@tanstack/react-query';
import { todoApi } from '@/lib/api/todos';
import { useTodo } from '@/contexts/TodoContext';
import { TaskData } from '@/types/todoTypes';
import { getTodayString, formatDateString } from '@/lib/utils/dateUtils';
import { todoCompletionsApi } from '@/lib/api/todoCompletions';

// Mutations specifically for IncompleteTasks component operations
export const useIncompleteTasksMutations = () => {
  const queryClient = useQueryClient();
  const { refetch, refetchTodayRecurring, refetchUpcomingRecurring } = useTodo();

  // Helper function to invalidate completed-tasks queries with all variations
  const invalidateCompletedTasksQueries = () => {
    queryClient.invalidateQueries({
      predicate: (query) => query.queryKey[0] === 'completed-tasks'
    });
  };

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

      // For daily tasks, increment completion count
      if (task.section === 'daily') {
        updates.completion_count = (task.completion_count || 0) + 1;
        updates.last_completed_date = today;
      }

      await todoApi.update(taskId, updates);
    },
    onSuccess: () => {
      refetch();
      refetchTodayRecurring();
      refetchUpcomingRecurring();
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      invalidateCompletedTasksQueries();
    },
  });

  // Soft delete by setting deleted_at timestamp
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const now = getTodayString();
      await todoApi.update(taskId, { deleted_at: now });
    },
    onSuccess: () => {
      refetch();
      refetchTodayRecurring();
      refetchUpcomingRecurring();
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
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
    onSuccess: () => {
      refetch();
      refetchTodayRecurring();
      refetchUpcomingRecurring();
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      invalidateCompletedTasksQueries();
    },
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
    onSuccess: () => {
      refetch();
      refetchTodayRecurring();
      refetchUpcomingRecurring();
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
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
    onSuccess: () => {
      refetch();
      refetchTodayRecurring();
      refetchUpcomingRecurring();
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  return {
    completeTaskMutation,
    deleteTaskMutation,
    bulkCompleteTasksMutation,
    bulkDeleteTasksMutation,
    updateTaskDatesMutation,
  };
};