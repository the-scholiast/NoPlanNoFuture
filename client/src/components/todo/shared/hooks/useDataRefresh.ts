import { useQueryClient } from '@tanstack/react-query';
import { useTodo } from '@/contexts/TodoContext';

export const useDataRefresh = () => {
  const queryClient = useQueryClient();
  const { refetch, refetchTodayRecurring, refetchUpcomingRecurring, refetchCompletedTasks } = useTodo();

  const refreshAllData = () => {
    console.log('🔄 Refreshing all todo data...');
    
    // Context refetches
    refetch();
    refetchTodayRecurring();
    refetchUpcomingRecurring();
    refetchCompletedTasks();
    
    // Query cache invalidations
    queryClient.invalidateQueries({
      queryKey: ['todos'],
      exact: false
    });
    
    queryClient.invalidateQueries({
      queryKey: ['recurring-todos'],
      exact: false
    });
    
    queryClient.invalidateQueries({
      predicate: (query) => {
        const isCompletedTasks = query.queryKey[0] === 'completed-tasks' || query.queryKey[0] === 'completed-tasks-context';
        if (isCompletedTasks) {
          console.log('🎯 Invalidating completed-tasks query:', query.queryKey);
        }
        return isCompletedTasks;
      }
    });
    
    console.log('✅ All data refreshed');
  };

  const refreshTodayData = () => {
    refetch();
    refetchTodayRecurring();
    refetchCompletedTasks();
    queryClient.invalidateQueries({ queryKey: ['todos'] });
    queryClient.invalidateQueries({ queryKey: ['recurring-todos', 'today'] });
  };

  const refreshUpcomingData = () => {
    refetch();
    refetchUpcomingRecurring();
    refetchCompletedTasks();
    queryClient.invalidateQueries({ queryKey: ['todos'] });
    queryClient.invalidateQueries({ queryKey: ['recurring-todos', 'upcoming'] });
  };

  return {
    refreshAllData,
    refreshTodayData,
    refreshUpcomingData,
  };
};