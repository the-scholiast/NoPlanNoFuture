import { useMutation, useQueryClient } from '@tanstack/react-query';
import { todoApi } from '@/lib/api/todos';
import { todoCompletionsApi } from '@/lib/api/todoCompletions';
import { TaskData } from '@/types/todoTypes';
import { getTodayString } from '@/lib/utils/dateUtils';
import { useDataRefresh } from './useDataRefresh';
import { transformTaskData } from '@/lib/api/transformers'; 

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

    onMutate: async ({ taskId, allTasks }) => {
      console.log('⚡ OPTIMISTIC UPDATE START:', taskId);

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['todos'] });
      await queryClient.cancelQueries({ queryKey: ['recurring-todos'] });

      // Get current cache data first
      const currentTodos = queryClient.getQueryData(['todos']) as TaskData[] | undefined;
      const currentTodayRecurring = queryClient.getQueryData(['recurring-todos', 'today']) as TaskData[] | undefined;
      const currentUpcomingRecurring = queryClient.getQueryData(['recurring-todos', 'upcoming']) as TaskData[] | undefined;

      // Find task in cache (not in stale allTasks parameter)
      const allCurrentTasks = [
        ...(currentTodos || []),
        ...(currentTodayRecurring || []),
        ...(currentUpcomingRecurring || [])
      ];

      const task = allCurrentTasks.find(t => t.id === taskId || (taskId.includes('_') && t.id === taskId.split('_')[0]));

      if (!task) {
        console.warn('Task not found for optimistic update:', taskId);
        return;
      }

      console.log('🔍 Task state debug:', {
        taskId,
        currentCompleted: task.completed,
        taskSource: 'CACHE (not parameter)'
      });

      const newCompleted = !task.completed;
      console.log(`Optimistically updating ${taskId} to completed: ${newCompleted}`);

      // Helper function to update tasks
      const updateTaskInArray = (tasks: TaskData[]): TaskData[] => {
        return tasks.map(t => {
          if (t.id === taskId || (taskId.includes('_') && t.id === taskId.split('_')[0])) {
            const updatedTask = {
              ...t,
              completed: newCompleted,
              completed_at: newCompleted ? new Date().toISOString() : undefined
            };
            console.log('✅ Updating task:', t.id, 'from', t.completed, 'to', newCompleted);
            return transformTaskData(updatedTask);
          }
          return t;
        });
      };

      // Apply optimistic updates to each cache separately
      if (currentTodos) {
        queryClient.setQueryData(['todos'], updateTaskInArray(currentTodos));
      }
      if (currentTodayRecurring) {
        queryClient.setQueryData(['recurring-todos', 'today'], updateTaskInArray(currentTodayRecurring));
      }
      if (currentUpcomingRecurring) {
        queryClient.setQueryData(['recurring-todos', 'upcoming'], updateTaskInArray(currentUpcomingRecurring));
      }

      console.log('✅ OPTIMISTIC UPDATE COMPLETE');

      return {
        previousTodos: currentTodos,
        previousTodayRecurring: currentTodayRecurring,
        previousUpcomingRecurring: currentUpcomingRecurring
      };
    },

    // Rollback on error
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
    },

    // Immediately refresh cache after mutation completes
    onSuccess: () => {
      console.log('✅ TOGGLE TASK SUCCESS - Refreshing cache');
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