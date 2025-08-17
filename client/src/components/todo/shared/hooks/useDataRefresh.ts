import { todoKeys } from '@/lib/queryKeys';
import { useQueryClient } from '@tanstack/react-query';

export const useDataRefresh = () => {
  const queryClient = useQueryClient();
  
  const refreshAllData = async () => {
    // Force React Query to refetch all todo data after mutations (create/update/delete tasks)
    await Promise.all([
      // Invalidate standardized query keys for different task views
      queryClient.invalidateQueries({ queryKey: todoKeys.all }), // All tasks
      queryClient.invalidateQueries({ queryKey: todoKeys.today }), // Today's tasks + recurring
      queryClient.invalidateQueries({ queryKey: todoKeys.upcoming }), // Future tasks + recurring 
      queryClient.invalidateQueries({ queryKey: todoKeys.completed }), // Completed tasks history
      queryClient.invalidateQueries({ queryKey: todoKeys.incomplete }), // Overdue/incomplete tasks
      queryClient.invalidateQueries({ queryKey: todoKeys.timetable.allWeeks }), // Calendar timetable data
      // Catch-all predicate to invalidate any missed task-related queries
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return key.includes('todo') || key.includes('task') || key.includes('completed') || key.includes('incomplete');
        }
      })
    ]);
  };

  return { refreshAllData };
};