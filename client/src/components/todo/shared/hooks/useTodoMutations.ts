import { useMutation, } from '@tanstack/react-query';
import { todoApi } from '@/lib/api/todos';
import { TaskData, CreateTaskData } from '@/types/todoTypes';
import { useTodo } from '@/contexts/TodoContext';
import { getTodayString } from '@/lib/utils/dateUtils';
import { todoCompletionsApi } from '@/lib/api/todoCompletions';
import { useQueryClient } from '@tanstack/react-query';

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

  const createToggleTaskFunction = () => {
    const queryClient = useQueryClient();

    return async (taskId: string, allTasks: TaskData[], isRecurringInstanceFn: (task: TaskData) => boolean) => {
      const task = allTasks.find(t => t.id === taskId);
      if (!task) {
        console.log('Task not found with ID:', taskId);
        return;
      }

      console.log('Toggling task:', task.title, 'Current status:', task.completed);

      const today = getTodayString();
      const originalTaskId = taskId.includes('_') ? taskId.split('_')[0] : taskId;

      try {
        if (!task.completed) {
          // COMPLETING A TASK
          console.log('Creating completion for task:', originalTaskId, 'date:', today);

          // 1. Create the completion record first (this is what CompletedTasks component needs)
          try {
            await todoCompletionsApi.createCompletion(originalTaskId, today);
            console.log('✅ Completion record created successfully');
          } catch (completionError) {
            console.error('❌ Failed to create completion record:', completionError);
            // Don't throw here, continue with task update as fallback
          }

          // 2. Update the task status
          const updates: Partial<TaskData> = {
            completed: true,
            completed_at: today,
          };

          // Handle daily tasks completion count
          if (task.section === 'daily') {
            updates.completion_count = (task.completion_count || 0) + 1;
            updates.last_completed_date = today;
          }

          console.log('Updating task with:', updates);
          await updateTaskMutation.mutateAsync({ id: taskId, updates });

        } else {
          // UNCOMPLETING A TASK
          console.log('Deleting completion for task:', originalTaskId, 'date:', today);

          // 1. Delete the completion record first
          try {
            // Try to find today's completion and delete it
            const completion = await todoCompletionsApi.getTodayCompletionForTask(originalTaskId, today);
            if (completion) {
              await todoCompletionsApi.deleteCompletion(completion.id);
              console.log('✅ Completion record deleted successfully');
            } else {
              // Fallback: use direct delete method
              await todoCompletionsApi.deleteCompletionByTaskAndDate(originalTaskId, today);
              console.log('✅ Completion record deleted via fallback method');
            }
          } catch (completionError) {
            console.error('❌ Failed to delete completion record:', completionError);
            // Continue with task update even if completion deletion fails
          }

          // 2. Update the task status
          const updates: Partial<TaskData> = {
            completed: false,
            completed_at: undefined,
          };

          // Handle daily tasks completion count
          if (task.section === 'daily') {
            updates.completion_count = Math.max((task.completion_count || 1) - 1, 0);
            if (updates.completion_count === 0) {
              updates.last_completed_date = undefined;
            }
          }

          console.log('Updating task with:', updates);
          await updateTaskMutation.mutateAsync({ id: taskId, updates });
        }

        console.log('Task updated successfully, refreshing queries...');

        // 3. Refresh all queries to update both TodoBoard and CompletedTasks
        queryClient.invalidateQueries({ queryKey: ['completed-tasks'] });
        refetch();
        refetchTodayRecurring();
        refetchUpcomingRecurring();

        console.log('✅ All queries refreshed');

      } catch (error) {
        console.error('❌ Error toggling task:', error);

        // More detailed error logging
        if (error instanceof Error) {
          console.error('Error name:', error.name);
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
        }

        // Don't throw to prevent UI from breaking
        // The error has been logged for debugging
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