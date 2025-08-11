import { useMutation, useQueryClient } from '@tanstack/react-query';
import { todoApi } from '@/lib/api/todos';
import { useTodo } from '@/contexts/TodoContext';
import { TaskData } from '@/types/todoTypes';

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

      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toISOString();

      // Update the task status directly - no need for completion records here
      // The completion system is for tracking daily recurring task completions
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
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      invalidateCompletedTasksQueries();
    },
  });

  // Delete task mutation - permanently deletes the task
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      // Soft delete by setting deleted_at timestamp
      const now = new Date().toISOString();
      await todoApi.update(taskId, { deleted_at: now });
    },
    onSuccess: () => {
      refetch();
      refetchTodayRecurring();
      refetchUpcomingRecurring();
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Bulk complete tasks mutation
  const bulkCompleteTasksMutation = useMutation({
    mutationFn: async (taskIds: string[]) => {
      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toISOString();

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
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      invalidateCompletedTasksQueries();
    },
  });

  // Bulk delete tasks mutation
  const bulkDeleteTasksMutation = useMutation({
    mutationFn: async (taskIds: string[]) => {
      const now = new Date().toISOString();
      
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
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Update task dates mutation - useful for fixing overdue tasks
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
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
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