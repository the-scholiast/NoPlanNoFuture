import { useMutation, useQueryClient } from '@tanstack/react-query';
import { todoApi } from '@/lib/api/todos';
import { todoCompletionsApi } from '@/lib/api/todoCompletions';
import { useTodo } from '@/contexts/TodoContext';
import { TaskData } from '@/types/todoTypes';
import { getTodayString } from '@/lib/utils/dateUtils';

export const useTodoMutations = () => {
  const queryClient = useQueryClient();
  const { refetch, refetchTodayRecurring, refetchUpcomingRecurring } = useTodo();

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (taskData: any) => todoApi.create(taskData),
    onSuccess: () => {
      refetch();
      refetchTodayRecurring();
      refetchUpcomingRecurring();
      // Invalidate all relevant query keys
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-todos'] });
      // Use predicate for completed-tasks to catch all variations
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'completed-tasks'
      });
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<TaskData> }) => {
      const originalTaskId = id.includes('_') ? id.split('_')[0] : id;
      return todoApi.update(originalTaskId, updates);
    },
    onSuccess: () => {
      refetch();
      refetchTodayRecurring();
      refetchUpcomingRecurring();
      // Invalidate all relevant query keys
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-todos'] });
      // Use predicate for completed-tasks to catch all variations
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'completed-tasks'
      });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => {
      const originalTaskId = taskId.includes('_') ? taskId.split('_')[0] : taskId;
      return todoApi.delete(originalTaskId);
    },
    onSuccess: () => {
      refetch();
      refetchTodayRecurring();
      refetchUpcomingRecurring();
      // Invalidate all relevant query keys
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-todos'] });
      // Use predicate for completed-tasks to catch all variations
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'completed-tasks'
      });
    },
  });

  // Clear completed tasks mutation
  const clearCompletedMutation = useMutation({
    mutationFn: (sectionKey: 'daily' | 'today' | 'upcoming') =>
      todoApi.deleteCompleted(sectionKey),
    onSuccess: (data, sectionKey) => {
      refetch();
      if (sectionKey === 'today') refetchTodayRecurring();
      if (sectionKey === 'upcoming') refetchUpcomingRecurring();
      // Invalidate all relevant query keys
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-todos'] });
      // Use predicate for completed-tasks to catch all variations
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'completed-tasks'
      });
    },
  });

  // Clear all tasks mutation
  const clearAllMutation = useMutation({
    mutationFn: (sectionKey: 'daily' | 'today' | 'upcoming') =>
      todoApi.deleteAll(sectionKey),
    onSuccess: (data, sectionKey) => {
      refetch();
      if (sectionKey === 'today') refetchTodayRecurring();
      if (sectionKey === 'upcoming') refetchUpcomingRecurring();
      // Invalidate all relevant query keys
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['recurring-todos'] });
      // Use predicate for completed-tasks to catch all variations
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'completed-tasks'
      });
    },
  });

  // Helper function to invalidate all queries - FIXED: No circular dependencies
  const invalidateAllQueries = () => {
    // Force refetch of the main tasks query that TodoContext uses
    refetch();
    refetchTodayRecurring();
    refetchUpcomingRecurring();

    // Invalidate React Query caches
    queryClient.invalidateQueries({ queryKey: ['todos'] });
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    queryClient.invalidateQueries({ queryKey: ['recurring-todos'] });

    // CRITICAL FIX: Invalidate completed-tasks with exact matching
    // This matches the queryKey structure in CompletedTasks hook
    queryClient.invalidateQueries({
      queryKey: ['completed-tasks'],
      exact: false // This ensures it matches all variations with different parameters
    });

    // Also force refetch to be sure
    queryClient.refetchQueries({
      queryKey: ['completed-tasks'],
      exact: false
    });
  };

  const createToggleTaskFunction = () => {
    return async (taskId: string, allTasks: TaskData[], isRecurringInstanceFn: (task: TaskData) => boolean) => {
      const task = allTasks.find(t => t.id === taskId);
      if (!task) {
        return;
      }

      const today = getTodayString();
      const originalTaskId = taskId.includes('_') ? taskId.split('_')[0] : taskId;
      const isRecurringInstance = taskId.includes('_') && !!task.parent_task_id;

      try {
        if (!task.completed) {

          // Create completion record for CompletedTasks component
          try {
            await todoCompletionsApi.createCompletion(originalTaskId, today);

            // Immediately refetch completed tasks to show the new completion
            queryClient.refetchQueries({
              predicate: (query) => query.queryKey[0] === 'completed-tasks'
            });

          } catch (completionError) {
            console.error('❌ Failed to create completion record:', completionError);
          }

          // Update the task directly via API (avoiding circular dependency)
          const updates: Partial<TaskData> = {
            completed: true,
            completed_at: getTodayString(),
          };

          // Special handling for daily tasks
          if (task.section === 'daily') {
            updates.completion_count = (task.completion_count || 0) + 1;
            updates.last_completed_date = today;
          }

          // CRITICAL FIX: Use todoApi directly instead of mutation to avoid circular dependency
          await todoApi.update(originalTaskId, updates);

        } else {
          // Delete completion record
          try {
            const completions = await todoCompletionsApi.getCompletionsForTaskAndDate(originalTaskId, today);
            if (completions && completions.length > 0) {
              await todoCompletionsApi.deleteCompletion(completions[0].id);

              // Immediately refetch completed tasks to remove the completion
              queryClient.refetchQueries({
                predicate: (query) => query.queryKey[0] === 'completed-tasks'
              });
            }
          } catch (completionError) {
            console.error('❌ Failed to delete completion record:', completionError);
          }

          // 2. Update the task directly via API (avoiding circular dependency)
          const updates: Partial<TaskData> = {
            completed: false,
            completed_at: undefined,
          };

          // Special handling for daily tasks
          if (task.section === 'daily') {
            const newCount = Math.max((task.completion_count || 1) - 1, 0);
            updates.completion_count = newCount;
            if (newCount === 0) {
              updates.last_completed_date = undefined;
            }
          }

          // Use todoApi directly instead of mutation to avoid circular dependency
          await todoApi.update(originalTaskId, updates);

        }

        // 3. Refresh all UI components
        invalidateAllQueries();

      } catch (error) {
        console.error('❌ ERROR toggling task:', error);
        // Enhanced error logging
        if (error instanceof Error) {
          console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
        }
        // Don't throw to prevent UI from breaking
      } finally {
        // Always invalidate queries regardless of success or failure
        invalidateAllQueries();

        // Add an additional forced refetch with a small delay to ensure all async operations complete
        setTimeout(() => {
          queryClient.refetchQueries({
            predicate: (query) => query.queryKey[0] === 'completed-tasks'
          });
        }, 200);
      }
    };
  };

  // Public API for components to use these mutations
  return {
    createTaskMutation,
    updateTaskMutation,
    deleteTaskMutation,
    clearCompletedMutation,
    clearAllMutation,
    toggleTaskFunction: createToggleTaskFunction(),
    isLoading: createTaskMutation.isPending ||
      updateTaskMutation.isPending ||
      deleteTaskMutation.isPending ||
      clearCompletedMutation.isPending ||
      clearAllMutation.isPending,
  };
}