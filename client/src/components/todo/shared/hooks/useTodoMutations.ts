import { useMutation, useQueryClient } from '@tanstack/react-query';
import { todoApi } from '@/lib/api/todos';
import { todoCompletionsApi } from '@/lib/api/todoCompletions';
import { TaskData } from '@/types/todoTypes';
import { getTodayString } from '@/lib/utils/dateUtils';
import { useDataRefresh } from './useDataRefresh';

export const useTodoMutations = () => {
  const { refreshAllData, refreshTodayData, refreshUpcomingData } = useDataRefresh();
  const queryClient = useQueryClient();

  // Convert toggleTask to a proper mutation with optimistic updates
  const toggleTaskMutation = useMutation({
    mutationFn: async ({ taskId, allTasks, isRecurringInstanceFn }: {
      taskId: string;
      allTasks: TaskData[];
      isRecurringInstanceFn: (task: TaskData) => boolean;
    }) => {
      const task = allTasks.find(t => t.id === taskId);
      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }

      const today = getTodayString();
      const originalTaskId = taskId.includes('_') ? taskId.split('_')[0] : taskId;
      const isRecurringInstance = taskId.includes('_') && !taskId.endsWith('_recurring');

      if (!task.completed) {
        // Marking as complete
        if (isRecurringInstance) {
          await todoCompletionsApi.createCompletion(originalTaskId, today);
        } else {
          const updates: Partial<TaskData> = {
            completed: true,
            completed_at: new Date().toISOString(),
          };

          updates.completion_count = (task.completion_count || 0) + 1;
          if (task.section === 'daily') {
            updates.last_completed_date = today;
          }

          await todoApi.update(originalTaskId, updates);
          await todoCompletionsApi.createCompletion(originalTaskId, today);
        }
      } else {
        // Marking as incomplete
        await todoCompletionsApi.deleteCompletionByTaskAndDate(originalTaskId, today);

        if (!isRecurringInstance) {
          await todoApi.update(originalTaskId, {
            completed: false,
            completed_at: undefined,
          });
        }
      }

      return { taskId, originalTaskId, wasCompleted: task.completed };
    },
    // ✅ OPTIMISTIC UPDATES - This is the key fix
    onMutate: async ({ taskId, allTasks }) => {
      console.log('⚡ OPTIMISTIC UPDATE START:', taskId);
      
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['todos'] });
      await queryClient.cancelQueries({ queryKey: ['recurring-todos'] });
      await queryClient.cancelQueries({ queryKey: ['completed-tasks-context'] });

      // Snapshot previous values
      const previousTodos = queryClient.getQueryData(['todos']);
      const previousTodayRecurring = queryClient.getQueryData(['recurring-todos', 'today']);
      const previousUpcomingRecurring = queryClient.getQueryData(['recurring-todos', 'upcoming']);
      const previousCompleted = queryClient.getQueryData(['completed-tasks-context']);

      // Find the task to update
      const task = allTasks.find(t => t.id === taskId);
      if (!task) {
        console.warn('Task not found for optimistic update:', taskId);
        return { previousTodos, previousTodayRecurring, previousUpcomingRecurring, previousCompleted };
      }

      const newCompleted = !task.completed;
      console.log(`Optimistically updating ${taskId} to completed: ${newCompleted}`);

      // Helper function to update task in cache
      const updateTaskInCache = (cacheData: TaskData[] = []) =>
        cacheData.map(t => {
          if (t.id === taskId || (taskId.includes('_') && t.id === taskId.split('_')[0])) {
            return { ...t, completed: newCompleted };
          }
          return t;
        });

      // Optimistically update all relevant caches
      queryClient.setQueryData(['todos'], updateTaskInCache);
      queryClient.setQueryData(['recurring-todos', 'today'], updateTaskInCache);
      queryClient.setQueryData(['recurring-todos', 'upcoming'], updateTaskInCache);

      console.log('✅ OPTIMISTIC UPDATE COMPLETE');
      return { previousTodos, previousTodayRecurring, previousUpcomingRecurring, previousCompleted };
    },
    // On error, rollback
    onError: (err, variables, context) => {
      console.log('❌ MUTATION ERROR - Rolling back optimistic update:', err);
      if (context?.previousTodos) {
        queryClient.setQueryData(['todos'], context.previousTodos);
      }
      if (context?.previousTodayRecurring) {
        queryClient.setQueryData(['recurring-todos', 'today'], context.previousTodayRecurring);
      }
      if (context?.previousUpcomingRecurring) {
        queryClient.setQueryData(['recurring-todos', 'upcoming'], context.previousUpcomingRecurring);
      }
      if (context?.previousCompleted) {
        queryClient.setQueryData(['completed-tasks-context'], context.previousCompleted);
      }
    },
    // Always refetch after completion
    onSettled: () => {
      console.log('🔄 MUTATION SETTLED - Final cache refresh');
      refreshAllData();
    },
  });

  // Create the function that components will call
  const createToggleTaskFunction = () => {
    return (taskId: string, allTasks: TaskData[], isRecurringInstanceFn: (task: TaskData) => boolean) => {
      console.log('🚀 TOGGLE TASK CALLED:', taskId);
      toggleTaskMutation.mutate({ taskId, allTasks, isRecurringInstanceFn });
    };
  };

  const createTaskMutation = useMutation({
    mutationFn: (taskData: any) => todoApi.create(taskData),
    onSuccess: refreshAllData,
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<TaskData> }) => {
      const originalTaskId = id.includes('_') ? id.split('_')[0] : id;
      return todoApi.update(originalTaskId, updates);
    },
    onSuccess: refreshAllData,
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => {
      const originalTaskId = taskId.includes('_') ? taskId.split('_')[0] : taskId;
      return todoApi.delete(originalTaskId);
    },
    onSuccess: refreshAllData,
  });

  const clearCompletedMutation = useMutation({
    mutationFn: (sectionKey: 'daily' | 'today' | 'upcoming') =>
      todoApi.deleteCompleted(sectionKey),
    onSuccess: (data, sectionKey) => {
      if (sectionKey === 'today') {
        refreshTodayData();
      } else if (sectionKey === 'upcoming') {
        refreshUpcomingData();
      } else {
        refreshAllData();
      }
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: (sectionKey: 'daily' | 'today' | 'upcoming') =>
      todoApi.deleteAll(sectionKey),
    onSuccess: refreshAllData,
  });

  // Uncomplete mutation for CompletedTasks component
  const uncompleteTaskMutation = useMutation({
    mutationFn: async (completionId: string) => {
      const completion = await todoCompletionsApi.getCompletion(completionId);
      if (!completion) {
        throw new Error('Completion not found');
      }

      await todoCompletionsApi.deleteCompletion(completionId);

      const today = getTodayString();
      const todayCompletions = await todoCompletionsApi.getCompletionsForTaskAndDate(
        completion.task_id,
        today
      );

      const task = await todoApi.get(completion.task_id);

      if (todayCompletions.length === 0) {
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

        await todoApi.update(completion.task_id, updates);
      }

      return { completionId, taskId: completion.task_id };
    },
    onSuccess: refreshAllData,
  });

  return {
    createTaskMutation,
    updateTaskMutation,
    deleteTaskMutation,
    clearCompletedMutation,
    clearAllMutation,
    toggleTaskFunction: createToggleTaskFunction(),
    toggleTaskMutation,
    uncompleteTaskMutation,
    isLoading: createTaskMutation.isPending ||
      updateTaskMutation.isPending ||
      deleteTaskMutation.isPending ||
      clearCompletedMutation.isPending ||
      clearAllMutation.isPending ||
      toggleTaskMutation.isPending ||
      uncompleteTaskMutation.isPending,
  };
};