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
      queryClient.invalidateQueries({ queryKey: ['recurring-todos'] });
      // Use predicate for completed-tasks to catch all variations
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey[0] === 'completed-tasks'
      });
    },
  });

  // Helper function to invalidate all queries
  const invalidateAllQueries = () => {
  // Use consistent query key patterns
  queryClient.invalidateQueries({ 
    queryKey: ['todos'],
    exact: false 
  });
  
  queryClient.invalidateQueries({ 
    queryKey: ['recurring-todos'],
    exact: false 
  });
  
  // Fix: Use predicate with more specific matching
  queryClient.invalidateQueries({
    predicate: (query) => {
      const [firstKey] = query.queryKey;
      return firstKey === 'completed-tasks';
    }
  });
  
  // Force immediate refetch for critical queries
  queryClient.refetchQueries({
    queryKey: ['todos'],
    exact: false
  });
};

  const createToggleTaskFunction = () => {
  return async (taskId: string, allTasks: TaskData[], isRecurringInstanceFn: (task: TaskData) => boolean) => {
    const task = allTasks.find(t => t.id === taskId);
    if (!task) {
      console.warn('Task not found:', taskId);
      return;
    }

    const today = getTodayString();
    const originalTaskId = taskId.includes('_') ? taskId.split('_')[0] : taskId;
    const isRecurringInstance = taskId.includes('_') && !taskId.endsWith('_recurring');

    try {
      // Optimistic update - immediately update UI
      queryClient.setQueryData(['todos'], (oldTasks: TaskData[] = []) => {
        return oldTasks.map(t => 
          t.id === taskId 
            ? { ...t, completed: !t.completed, completed_at: !t.completed ? new Date().toISOString() : undefined }
            : t
        );
      });

      if (!task.completed) {
        // Marking as complete
        if (isRecurringInstance) {
          await todoCompletionsApi.createCompletion(originalTaskId, today);
        } else {
          const updates: Partial<TaskData> = {
            completed: true,
            completed_at: new Date().toISOString(),
          };

          if (task.section === 'daily') {
            updates.completion_count = (task.completion_count || 0) + 1;
            updates.last_completed_date = today;
            await todoCompletionsApi.createCompletion(originalTaskId, today);
          }

          await todoApi.update(originalTaskId, updates);
        }
      } else {
        // Marking as incomplete
        if (task.section === 'daily' || isRecurringInstance) {
          const completions = await todoCompletionsApi.getCompletionsForTaskAndDate(originalTaskId, today);
          if (completions.length > 0) {
            await todoCompletionsApi.deleteCompletion(completions[0].id);
          }
        }

        if (!isRecurringInstance) {
          await todoApi.update(originalTaskId, {
            completed: false,
            completed_at: undefined,
          });
        }
      }

      // Selective invalidation instead of invalidating everything
      invalidateAllQueries();

    } catch (error) {
      console.error('❌ ERROR toggling task:', error);
      // Revert optimistic update on error
      queryClient.invalidateQueries({ queryKey: ['todos'] });
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