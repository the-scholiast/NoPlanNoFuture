import { todoKeys } from '@/lib/queryKeys';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

export const useDataRefresh = () => {
  const queryClient = useQueryClient();
  
  const refreshAllData = useCallback(async () => {
    // Force React Query to refetch all todo data after mutations (create/update/delete tasks)
    await Promise.all([
      // Invalidate standardized query keys for different task views
      queryClient.invalidateQueries({ queryKey: todoKeys.all }), // All tasks
      queryClient.invalidateQueries({ queryKey: todoKeys.today }), // Today's tasks + recurring
      queryClient.invalidateQueries({ queryKey: todoKeys.upcoming }), // Future tasks + recurring 
      queryClient.invalidateQueries({ queryKey: todoKeys.completed }), // Completed tasks history
      queryClient.invalidateQueries({ queryKey: todoKeys.incomplete }), // Overdue/incomplete tasks
      queryClient.invalidateQueries({ queryKey: todoKeys.timetable.allWeeks }), // Calendar timetable data
      queryClient.invalidateQueries({ queryKey: todoKeys.deleted }), // Soft deleted tasks
      // Catch-all predicate to invalidate any missed task-related queries
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return key.includes('todo') || key.includes('task') || key.includes('completed') || key.includes('incomplete');
        }
      })
    ]);
  }, [queryClient]);

  return { refreshAllData };
};