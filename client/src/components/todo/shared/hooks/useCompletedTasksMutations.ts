import { useMutation, useQueryClient } from '@tanstack/react-query';
import { todoApi } from '@/lib/api/todos';
import { todoCompletionsApi } from '@/lib/api/todoCompletions';
import { useTodo } from '@/contexts/TodoContext';

// Mutations specifically for CompletedTasks component operations
// These handle the logic for the new todo_completions table

export const useCompletedTasksMutations = () => {
  const queryClient = useQueryClient();
  const { refetch, refetchTodayRecurring, refetchUpcomingRecurring } = useTodo();

  // Uncomplete task mutation - deletes the specific completion record
  const uncompleteTaskMutation = useMutation({
    mutationFn: async (completionId: string) => {
      // Delete the specific completion record
      await todoCompletionsApi.deleteCompletion(completionId);

      // Note: We don't need to update the task's completed status here
      // because a task can have multiple completions. The task should only
      // be marked as incomplete if it has no completions for today
      // (this logic should be handled on the backend or in the TodoBoard component)
    },
    onSuccess: () => {
      // Refresh all task-related queries
      refetch();
      refetchTodayRecurring();
      refetchUpcomingRecurring();
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['completed-tasks'] });
    },
  });

  // Delete entire task mutation - deletes task and all its completions
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      // Delete all completions for this task first (handled by CASCADE in DB)
      // Then delete the task itself
      return todoApi.delete(taskId);
    },
    onSuccess: () => {
      // Refresh all task-related queries
      refetch();
      refetchTodayRecurring();
      refetchUpcomingRecurring();
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['completed-tasks'] });
    },
  });

  // Complete task mutation - creates a new completion record
  const completeTaskMutation = useMutation({
    mutationFn: async ({ taskId, instanceDate }: { taskId: string; instanceDate: string }) => {
      // Create a completion record
      await todoCompletionsApi.createCompletion(taskId, instanceDate);

      // For non-recurring tasks, also mark the task as completed
      // For recurring tasks, the task itself stays incomplete but has completion records
      // This logic should be determined based on task type
    },
    onSuccess: () => {
      refetch();
      refetchTodayRecurring();
      refetchUpcomingRecurring();
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['completed-tasks'] });
    },
  });

  // Bulk operations for completed tasks
  const bulkDeleteCompletionsMutation = useMutation({
    mutationFn: async (completionIds: string[]) => {
      // Delete multiple completion records
      return Promise.all(completionIds.map(id => todoCompletionsApi.deleteCompletion(id)));
    },
    onSuccess: () => {
      refetch();
      refetchTodayRecurring();
      refetchUpcomingRecurring();
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['completed-tasks'] });
    },
  });

  // Delete all completions for a task
  const deleteAllTaskCompletionsMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return todoCompletionsApi.deleteAllTaskCompletions(taskId);
    },
    onSuccess: () => {
      refetch();
      refetchTodayRecurring();
      refetchUpcomingRecurring();
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['completed-tasks'] });
    },
  });

  return {
    uncompleteTaskMutation,
    deleteTaskMutation,
    completeTaskMutation,
    bulkDeleteCompletionsMutation,
    deleteAllTaskCompletionsMutation,
  };
}