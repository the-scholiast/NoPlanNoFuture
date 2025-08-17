import { todoKeys } from '@/lib/queryKeys';
import { useQueryClient } from '@tanstack/react-query';

export const useDataRefresh = () => {
  const queryClient = useQueryClient();

  const refreshAllData = async () => {
    console.log('🔄 Refreshing ALL data - invalidating all queries');
    
    // Invalidate all todo-related queries
    await Promise.all([
      // New query keys
      queryClient.invalidateQueries({ queryKey: todoKeys.all }),
      queryClient.invalidateQueries({ queryKey: todoKeys.today }),
      queryClient.invalidateQueries({ queryKey: todoKeys.upcoming }),
      queryClient.invalidateQueries({ queryKey: todoKeys.completed }),
      queryClient.invalidateQueries({ queryKey: todoKeys.incomplete }),
      queryClient.invalidateQueries({ queryKey: todoKeys.timetable.allWeeks }),
      
      // Legacy query keys for backward compatibility
      queryClient.invalidateQueries({ queryKey: ['todos'] }),
      queryClient.invalidateQueries({ queryKey: ['recurring-todos', 'today'] }),
      queryClient.invalidateQueries({ queryKey: ['recurring-todos', 'upcoming'] }),
      queryClient.invalidateQueries({ queryKey: ['completed-tasks'] }),
      queryClient.invalidateQueries({ queryKey: ['completed-tasks-context'] }),
      queryClient.invalidateQueries({ queryKey: ['tasks'] }),
      queryClient.invalidateQueries({ queryKey: ['incomplete-tasks'] }),
      
      // Invalidate with predicates to catch any variations
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return key.includes('todo') || key.includes('task') || key.includes('completed') || key.includes('incomplete');
        }
      })
    ]);
    
    console.log('✅ ALL data refresh complete');
  };

  const refreshTodayData = () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] });
    queryClient.invalidateQueries({ queryKey: ['recurring-todos', 'today'] });
    queryClient.invalidateQueries({ queryKey: todoKeys.all });
    queryClient.invalidateQueries({ queryKey: todoKeys.today });
    queryClient.invalidateQueries({ queryKey: todoKeys.completed });
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
    queryClient.invalidateQueries({ queryKey: todoKeys.all });
    queryClient.invalidateQueries({ queryKey: todoKeys.upcoming });
    queryClient.invalidateQueries({ queryKey: todoKeys.completed });
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