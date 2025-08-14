import { useMutation } from '@tanstack/react-query';
import { todoApi } from '@/lib/api/todos';
import { todoCompletionsApi } from '@/lib/api/todoCompletions';
import { TaskData } from '@/types/todoTypes';
import { getTodayString } from '@/lib/utils/dateUtils';
import { useDataRefresh } from './useDataRefresh';

export const useTodoMutations = () => {
  const { refreshAllData, refreshTodayData, refreshUpcomingData } = useDataRefresh();

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
        if (!task.completed) {
          // Marking as complete
          console.log('🟢 Completing task:', taskId, 'Original ID:', originalTaskId);

          if (isRecurringInstance) {
            // For recurring instances, only create completion record
            await todoCompletionsApi.createCompletion(originalTaskId, today);
          } else {
            // For regular tasks, update the task AND create completion record
            const updates: Partial<TaskData> = {
              completed: true,
              completed_at: new Date().toISOString(),
            };

            updates.completion_count = (task.completion_count || 0) + 1;
            if (task.section === 'daily') {
              updates.last_completed_date = today;
            }

            await todoApi.update(originalTaskId, updates);
            // ALWAYS create completion record for tracking in CompletedTasks
            await todoCompletionsApi.createCompletion(originalTaskId, today);
          }
        } else {
          // Marking as incomplete
          console.log('🔴 Uncompleting task:', taskId, 'Original ID:', originalTaskId);
          // Use the correct API method for deleting completions
          await todoCompletionsApi.deleteCompletionByTaskAndDate(originalTaskId, today);

          if (!isRecurringInstance) {
            await todoApi.update(originalTaskId, {
              completed: false,
              completed_at: undefined,
            });
          }
        }

        console.log('✅ Task toggle completed, refreshing data...');
        refreshAllData(); 

      } catch (error) {
        console.error('❌ ERROR toggling task:', error);
        refreshAllData(); 
      }
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
};