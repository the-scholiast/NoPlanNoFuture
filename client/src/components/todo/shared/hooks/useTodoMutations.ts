import { useMutation, } from '@tanstack/react-query';
import { todoApi } from '@/lib/api/todos';
import { TaskData, CreateTaskData } from '@/types/todoTypes';
import { useTodo } from '@/contexts/TodoContext';
import { getTodayString } from '@/lib/utils/dateUtils';

// Centralized mutation management for all todo write operations
export const useTodoMutations = () => {
  const { refetch, refetchTodayRecurring, refetchUpcomingRecurring } = useTodo();

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (taskData: CreateTaskData) => todoApi.create(taskData),
    onSuccess: () => {
      refetch(); // Main todos query
      refetchTodayRecurring(); // Today's recurring tasks
      refetchUpcomingRecurring(); // Upcoming recurring tasks
    }
  })

  // Updates an existing task
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<TaskData> }) => {
      // If ID contains '_', it's a recurring task instance (e.g., "task123_20241207")
      // Extract the original task ID ("task123") for the API call
      const originalTaskId = id.includes('_') ? id.split('_')[0] : id;
      return todoApi.update(originalTaskId, updates);
    },
    onSuccess: () => {
      // Refresh all related data after successful update
      refetch();
      refetchTodayRecurring();
      refetchUpcomingRecurring();
    },
  });

  // Soft deletes a task
  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => {
      const originalTaskId = taskId.includes('_') ? taskId.split('_')[0] : taskId;
      return todoApi.delete(originalTaskId);
    },
    onSuccess: () => {
      refetch();
      refetchTodayRecurring();
      refetchUpcomingRecurring();
    },
  });

  // Clear completed tasks mutation (soft delete)
  const clearCompletedMutation = useMutation({
    mutationFn: (sectionKey: 'daily' | 'today' | 'upcoming') =>
      todoApi.deleteCompleted(sectionKey),
    onSuccess: (data, sectionKey) => {
      refetch();
      if (sectionKey === 'today') refetchTodayRecurring();
      if (sectionKey === 'upcoming') refetchUpcomingRecurring();
    },
  });

  // Clear all tasks mutation (soft delete)
  const clearAllMutation = useMutation({
    mutationFn: (sectionKey: 'daily' | 'today' | 'upcoming') =>
      todoApi.deleteAll(sectionKey),
    onSuccess: (data, sectionKey) => {
      refetch();
      if (sectionKey === 'today') refetchTodayRecurring();
      if (sectionKey === 'upcoming') refetchUpcomingRecurring();
    },
  });

  // Complex toggle task function preserving all original logic
  const createToggleTaskFunction = () => {
    return (taskId: string, allTasks: TaskData[], isRecurringInstanceFn: (task: TaskData) => boolean) => {
      const task = allTasks.find(t => t.id === taskId);
      if (!task) {
        console.log('Task not found with ID:', taskId);
        console.log('Available task IDs:', allTasks.map(t => t.id));
        return;
      }

      const today = getTodayString();
      const isDailyTask = task.section === 'daily';
      const isRecurringTask = task.is_recurring || isRecurringInstanceFn(task);

      if (!task.completed) {
        // Completing a task
        const baseUpdates: Partial<TaskData> = {
          completed: true,
          completed_at: today,
        };

        if (isDailyTask) {
          // Additional updates for daily tasks
          const dailyUpdates = {
            ...baseUpdates,
            completion_count: (task.completion_count || 0) + 1,
            last_completed_date: today
          };
          updateTaskMutation.mutate({ id: taskId, updates: dailyUpdates });
        } else if (isRecurringTask && isRecurringInstanceFn(task)) {
          // For recurring task instances, we only update completion status
          updateTaskMutation.mutate({ id: taskId, updates: baseUpdates });
        } else {
          // Regular tasks use base updates only
          updateTaskMutation.mutate({ id: taskId, updates: baseUpdates });
        }
      } else {
        // Uncompleting a task
        const baseUpdates: Partial<TaskData> = {
          completed: false,
          completed_at: undefined,
        };

        if (isDailyTask) {
          // Additional updates for daily tasks
          const dailyUpdates = {
            ...baseUpdates,
            completion_count: Math.max((task.completion_count || 1) - 1, 0),
            last_completed_date: (task.completion_count || 1) <= 1 ? undefined : task.last_completed_date
          };
          updateTaskMutation.mutate({ id: taskId, updates: dailyUpdates });
        } else {
          // Regular tasks and recurring instances use base updates only
          updateTaskMutation.mutate({ id: taskId, updates: baseUpdates });
        }
      }
    };
  };

  // Public API for components to use these mutations
  return {
    createTaskMutation,  // For creating new tasks
    updateTaskMutation,  // For editing existing tasks
    deleteTaskMutation,  // For removing tasks
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