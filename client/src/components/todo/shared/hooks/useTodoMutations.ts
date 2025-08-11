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
    console.log('Invalidating all queries...');
    
    // Invalidate React Query caches
    queryClient.invalidateQueries({ queryKey: ['todos'] }); // For TodoBoard
    queryClient.invalidateQueries({ queryKey: ['tasks'] }); // For other components
    
    // CRITICAL FIX: Invalidate completed-tasks queries with partial matching
    // This handles the ['completed-tasks', dateFilter] structure used by CompletedTasks
    queryClient.invalidateQueries({ 
      predicate: (query) => {
        return query.queryKey[0] === 'completed-tasks';
      }
    });
    
    queryClient.invalidateQueries({ queryKey: ['recurring-todos'] }); // For recurring task instances
    
    // Call refetch functions as backup
    refetch();
    refetchTodayRecurring();
    refetchUpcomingRecurring();
    
    console.log('✅ All queries invalidated');
  };

  const createToggleTaskFunction = () => {
    return async (taskId: string, allTasks: TaskData[], isRecurringInstanceFn: (task: TaskData) => boolean) => {
      const task = allTasks.find(t => t.id === taskId);
      if (!task) {
        console.log('❌ Task not found with ID:', taskId);
        console.log('Available tasks:', allTasks.map(t => ({ id: t.id, title: t.title, completed: t.completed })));
        return;
      }

      console.log(`🔄 Toggling task: "${task.title}" (${taskId})`);
      console.log(`Current status: ${task.completed ? 'COMPLETED' : 'INCOMPLETE'}`);
      console.log(`Task section: ${task.section}`);

      const today = getTodayString();
      const originalTaskId = taskId.includes('_') ? taskId.split('_')[0] : taskId;
      const isRecurringInstance = taskId.includes('_') && !!task.parent_task_id;
      
      console.log(`Original task ID: ${originalTaskId}`);
      console.log(`Is recurring instance: ${isRecurringInstance}`);

      try {
        if (!task.completed) {
          // ========== COMPLETING A TASK ==========
          console.log('📝 COMPLETING TASK...');

          // 1. Create completion record for CompletedTasks component
          console.log(`Creating completion record for task ${originalTaskId} on ${today}`);
          try {
            await todoCompletionsApi.createCompletion(originalTaskId, today);
            console.log('✅ Completion record created successfully');
          } catch (completionError) {
            console.error('❌ Failed to create completion record:', completionError);
            // Continue anyway - the task update is more important
          }

          // 2. Update the task directly via API (avoiding circular dependency)
          const updates: Partial<TaskData> = {
            completed: true,
            completed_at: getTodayString(),
          };

          // Special handling for daily tasks
          if (task.section === 'daily') {
            updates.completion_count = (task.completion_count || 0) + 1;
            updates.last_completed_date = today;
            console.log(`Daily task - incrementing completion count to: ${updates.completion_count}`);
          }

          console.log('📤 Updating task with:', updates);
          
          // CRITICAL FIX: Use todoApi directly instead of mutation to avoid circular dependency
          await todoApi.update(originalTaskId, updates);
          
          console.log('✅ Task marked as completed');

        } else {
          // ========== UNCOMPLETING A TASK ==========
          console.log('↩️ UNCOMPLETING TASK...');

          // 1. Delete completion record
          console.log(`Deleting completion record for task ${originalTaskId} on ${today}`);
          try {
            // Find and delete today's completion
            const completions = await todoCompletionsApi.getCompletionsForTaskAndDate(originalTaskId, today);
            
            if (completions && completions.length > 0) {
              await todoCompletionsApi.deleteCompletion(completions[0].id);
              console.log('✅ Completion record deleted successfully');
            } else {
              console.log('⚠️ No completion record found for today');
            }
          } catch (completionError) {
            console.error('❌ Failed to delete completion record:', completionError);
            // Continue anyway - the task update is more important
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
            console.log(`Daily task - decrementing completion count to: ${newCount}`);
          }

          console.log('📤 Updating task with:', updates);
          
          // CRITICAL FIX: Use todoApi directly instead of mutation to avoid circular dependency
          await todoApi.update(originalTaskId, updates);
          
          console.log('✅ Task marked as incomplete');
        }

        // 3. Refresh all UI components
        console.log('🔄 Refreshing UI...');
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
        console.log('⚠️ Task toggle failed, but UI will remain functional');
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