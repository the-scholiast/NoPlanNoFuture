import { useMutation, useQueryClient } from '@tanstack/react-query';
import { todoApi } from '@/lib/api/todos';
import { todoCompletionsApi } from '@/lib/api/todoCompletions';
import { TaskData } from '@/types/todoTypes';
import { getTodayString } from '@/lib/utils/dateUtils';
import { transformTaskData } from '@/lib/api/transformers';
import { todoKeys } from '@/lib/queryKeys';
import { useDataRefresh } from './useDataRefresh';

export const useTodoMutations = () => {
  const queryClient = useQueryClient();
  const { refreshAllData } = useDataRefresh()

  // Complex toggle mutation with optimistic updates and completion tracking
  const toggleTaskMutation = useMutation({
    mutationFn: async ({ taskId, allTasks }: { taskId: string; allTasks: TaskData[] }) => {
      const today = getTodayString();
      const originalTaskId = taskId.includes('_') ? taskId.split('_')[0] : taskId;

      // Find the task in the provided allTasks array
      const task = allTasks.find(t => t.id === taskId || t.id === originalTaskId);
      if (!task) {
        throw new Error('Task not found');
      }

      if (!task.completed) {
        // Create completion record for CompletedTasks component
        try {
          await todoCompletionsApi.createCompletion(originalTaskId, today);
        } catch (completionError) {
          console.error('Failed to create completion record:', completionError);
          // Continue with task update even if completion record fails
        }

        const updates: Partial<TaskData> = { completed: true, completed_at: today, };
        updates.completion_count = (task.completion_count || 0) + 1;
        updates.last_completed_date = today;

        return todoApi.update(originalTaskId, updates);
      } else {
        // Uncompleting a task - remove completion record
        try {
          const todayCompletions = await todoCompletionsApi.getCompletionsForTaskAndDate(originalTaskId, today);
          if (todayCompletions.length > 0) {
            await todoCompletionsApi.deleteCompletion(todayCompletions[0].id);
          }
        } catch (completionError) {
          console.error('Failed to delete completion record:', completionError);
          // Continue with task update even if completion deletion fails
        }

        const updates: Partial<TaskData> = { completed: false, completed_at: undefined, };
        updates.completion_count = Math.max((task.completion_count || 1) - 1, 0);

        // Only clear last_completed_date if completion_count becomes 0
        if (updates.completion_count === 0) {
          updates.last_completed_date = undefined;
        }

        return todoApi.update(originalTaskId, updates);
      }
    },

    // Optimistic update for instant UI feedback
    onMutate: async ({ taskId, allTasks }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: todoKeys.all });
      await queryClient.cancelQueries({ queryKey: todoKeys.today });
      await queryClient.cancelQueries({ queryKey: todoKeys.upcoming });
      await queryClient.cancelQueries({ queryKey: todoKeys.completed });
      await queryClient.cancelQueries({ queryKey: todoKeys.incomplete });

      // Snapshot current data
      const currentTodos = queryClient.getQueryData<TaskData[]>(todoKeys.all);
      const currentTodayRecurring = queryClient.getQueryData<TaskData[]>(todoKeys.today);
      const currentUpcomingRecurring = queryClient.getQueryData<TaskData[]>(todoKeys.upcoming);

      // Find the task to toggle
      const task = allTasks.find(t => t.id === taskId) || allTasks.find(t => t.id === taskId.split('_')[0]);
      if (!task) {
        console.warn('Task not found for optimistic update:', taskId);
        return;
      }

      const newCompleted = !task.completed;

      // Helper function to update task in an array
      const updateTaskInArray = (tasks: TaskData[]) => {
        return tasks.map(t => {
          if (t.id === taskId || t.id === taskId.split('_')[0]) {
            const updatedTask = {
              ...t,
              completed: newCompleted,
              completed_at: newCompleted ? getTodayString() : undefined
            };

            // Handle daily task completion count
            if (newCompleted) {
              updatedTask.completion_count = (t.completion_count || 0) + 1;
              updatedTask.last_completed_date = getTodayString();
            } else {
              updatedTask.completion_count = Math.max((t.completion_count || 1) - 1, 0);
              if (updatedTask.completion_count === 0) {
                updatedTask.last_completed_date = undefined;
              }
            }
            return transformTaskData(updatedTask);
          }
          return t;
        });
      };

      // Apply optimistic updates to each cache
      if (currentTodos) {
        queryClient.setQueryData(todoKeys.all, updateTaskInArray(currentTodos));
      }
      if (currentTodayRecurring) {
        queryClient.setQueryData(todoKeys.today, updateTaskInArray(currentTodayRecurring));
      }
      if (currentUpcomingRecurring) {
        queryClient.setQueryData(todoKeys.upcoming, updateTaskInArray(currentUpcomingRecurring));
      }

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
        queryClient.setQueryData(todoKeys.all, context.previousTodos);
      }
      if (context?.previousTodayRecurring) {
        queryClient.setQueryData(todoKeys.today, context.previousTodayRecurring);
      }
      if (context?.previousUpcomingRecurring) {
        queryClient.setQueryData(todoKeys.upcoming, context.previousUpcomingRecurring);
      }
    },

    // Refresh data after mutation completes
    onSuccess: () => {
      refreshAllData();
    },
  });

  // Create the function that components will call
  const createToggleTaskFunction = () => {
    return (taskId: string, allTasks: TaskData[], isRecurringInstanceFn: (task: TaskData) => boolean) => {
      toggleTaskMutation.mutate({ taskId, allTasks });
    };
  };

  // Basic CRUD mutations with data refresh
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

      // Only update task if no other completions exist for today
      if (todayCompletions.length === 0) {
        const updates: Partial<TaskData> = { completed: false, completed_at: undefined, };

        updates.completion_count = Math.max((task.completion_count || 1) - 1, 0);
        if (updates.completion_count === 0) {
          updates.last_completed_date = undefined;
        }

        await todoApi.update(completion.task_id, updates);
      }

      return { completionId, taskId: completion.task_id };
    },
    onSuccess: refreshAllData,
  });

  // Complete mutation for IncompleteTasks component
  const completeTaskMutation = useMutation({
    mutationFn: async ({ taskId, instanceDate }: {
      taskId: string; 
      instanceDate?: string; // Optional - defaults to today
    }) => {
      const task = await todoApi.get(taskId);
      if (!task) throw new Error('Task not found');

      const today = getTodayString();
      const now = getTodayString();
      const useDate = instanceDate || today; // Use provided date or default to today
      const originalTaskId = taskId.includes('_') ? taskId.split('_')[0] : taskId;

      await todoCompletionsApi.createCompletion(originalTaskId, useDate);

      const updates: Partial<TaskData> = {
        completed: true,
        completed_at: now,
        completion_count: (task.completion_count || 0) + 1,
      };

      // Daily tasks track completion date differently (update completion for every recent instance task completed)
      if (task.section === 'daily') {
        updates.last_completed_date = useDate;
      }

      return todoApi.update(taskId, updates);
    },
    onSuccess: refreshAllData,
  });

  return {
    // Task operations
    toggleTaskFunction: createToggleTaskFunction(),
    createTaskMutation,
    updateTaskMutation,
    deleteTaskMutation,
    uncompleteTaskMutation,
    completeTaskMutation,

    // Utility
    refreshAllData,
  };
};