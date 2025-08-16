import { todoKeys } from '@/lib/queryKeys';
import { useQueryClient } from '@tanstack/react-query';

export const useDataRefresh = () => {
  const queryClient = useQueryClient();

  const refreshAllData = () => {
    queryClient.invalidateQueries({ queryKey: todoKeys.all });
    queryClient.invalidateQueries({ queryKey: todoKeys.today });
    queryClient.invalidateQueries({ queryKey: todoKeys.upcoming });
    queryClient.invalidateQueries({ queryKey: todoKeys.completed });
    queryClient.invalidateQueries({ queryKey: todoKeys.timetable.allWeeks });
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