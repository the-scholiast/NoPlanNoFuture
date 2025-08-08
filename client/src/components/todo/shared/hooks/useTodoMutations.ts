import { useMutation, useQueryClient } from '@tanstack/react-query';
import { todoApi } from '@/lib/api/todos';
import { recurringTodoApi } from '@/lib/api/recurringTodosApi';
import { TaskData, CreateTaskData } from '@/types/todoTypes';
import { useTodo } from '@/contexts/TodoContext';

// Centralized mutation management for all todo write operations
export const useTodoMutations = () => {
  const queryClient = useQueryClient(); // For manual cache management
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

  // Toggling task completion status
  const toggleTaskMutation = useMutation({
    mutationFn: ({ taskId, completed }: { taskId: string; completed: boolean }) => {
      const originalTaskId = taskId.includes('_') ? taskId.split('_')[0] : taskId;
      return todoApi.update(originalTaskId, { completed });
    },
    onSuccess: () => {
      refetch();
      refetchTodayRecurring();
      refetchUpcomingRecurring();
    },
  });

  // Public API for components to use these mutations
  return {
    createTaskMutation,  // For creating new tasks
    updateTaskMutation,  // For editing existing tasks
    deleteTaskMutation,  // For removing tasks
    toggleTaskMutation,  // For marking tasks complete/incomplete
    isLoading: createTaskMutation.isPending ||
      updateTaskMutation.isPending ||
      deleteTaskMutation.isPending ||
      toggleTaskMutation.isPending,  // Combined loading state
  };
}