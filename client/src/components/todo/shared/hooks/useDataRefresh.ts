import { useQueryClient } from '@tanstack/react-query';

export const useDataRefresh = () => {
  const queryClient = useQueryClient();

  const refreshAllData = () => {
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

    queryClient.invalidateQueries({
      queryKey: ['timetable-week'],
      exact: false
    });
  };

  const refreshTodayData = () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] });
    queryClient.invalidateQueries({ queryKey: ['recurring-todos', 'today'] });
    queryClient.invalidateQueries({
      predicate: (query) => {
        return query.queryKey[0] === 'completed-tasks' || query.queryKey[0] === 'completed-tasks-context';
      }
    });
    queryClient.invalidateQueries({
      queryKey: ['timetable-week'],
      exact: false
    });
  };

  const refreshUpcomingData = () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] });
    queryClient.invalidateQueries({ queryKey: ['recurring-todos', 'upcoming'] });
    queryClient.invalidateQueries({
      predicate: (query) => {
        return query.queryKey[0] === 'completed-tasks' || query.queryKey[0] === 'completed-tasks-context';
      }
    });
    queryClient.invalidateQueries({
      queryKey: ['timetable-week'],
      exact: false
    });
  };

  return {
    refreshAllData,
    refreshTodayData,
    refreshUpcomingData,
  };
};