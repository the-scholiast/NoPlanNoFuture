import { useState, useMemo, } from 'react';
import { useQuery, } from '@tanstack/react-query';
import { CompletedTasksState, DateFilterState, CompletedTaskWithCompletion } from '../../shared/types';
import { useCompletedTasksMutations } from '../../shared/hooks/useCompletedTasksMutations';
import { getCurrentWeekStart, getCurrentWeekEnd } from '../../shared/utils';
import { todoCompletionsApi, CompletedTaskWithDetails } from '@/lib/api/todoCompletions';


export const useCompletedTasks = () => {
  // Component state
  const [state, setState] = useState<CompletedTasksState>({
    expandedTask: null,
    isTasksExpanded: false,
    sortedCompletedTasks: [],
    searchQuery: '',
    dateFilter: {
      startDate: getCurrentWeekStart(),
      endDate: getCurrentWeekEnd(),
      enabled: true
    }
  });

  // Create a stable query key that changes when date filter changes
  const queryKey = useMemo(() => [
    'completed-tasks',
    state.dateFilter.enabled,
    state.dateFilter.startDate,
    state.dateFilter.endDate,
  ], [state.dateFilter.enabled, state.dateFilter.startDate, state.dateFilter.endDate]);

  // Query for completed tasks with completions
  const {
    data: completedTasksData = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: () => {
      if (state.dateFilter.enabled) {
        return todoCompletionsApi.getCompletionsInRange(
          state.dateFilter.startDate,
          state.dateFilter.endDate
        );
      }
      return todoCompletionsApi.getCompletedTasks();
    },
  });

  // Transform API data to component format
  const processedCompletedTasks = useMemo(() => {
    return completedTasksData.map((item: CompletedTaskWithDetails): CompletedTaskWithCompletion => ({
      ...item,
      is_recurring_instance: item.is_recurring || false,
      completion_count: item.completion_count
    }));
  }, [completedTasksData]);

  // Apply search filter and sorting
  const filteredTasks = useMemo(() => {
    let filtered = processedCompletedTasks;

    // Search filter
    if (state.searchQuery.trim()) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
      );
    }

    // Sort by completion date (most recent first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.completion.completed_at);
      const dateB = new Date(b.completion.completed_at);
      return dateB.getTime() - dateA.getTime();
    });

    // Use sorted tasks if manually sorted, otherwise use filtered
    const result = state.sortedCompletedTasks.length > 0 ? state.sortedCompletedTasks : filtered;

    return result;
  }, [processedCompletedTasks, state.searchQuery, state.dateFilter, state.sortedCompletedTasks]);

  // Get mutations
  const { uncompleteTaskMutation, deleteTaskMutation } = useCompletedTasksMutations();

  // Action handlers
  const toggleTaskExpansion = (completionId: string) => {
    setState(prev => ({
      ...prev,
      expandedTask: prev.expandedTask === completionId ? null : completionId
    }));
  };

  const toggleTasksExpansion = () => {
    setState(prev => ({
      ...prev,
      isTasksExpanded: !prev.isTasksExpanded
    }));
  };

  const updateSearchQuery = (query: string) => {
    setState(prev => ({
      ...prev,
      searchQuery: query
    }));
  };

  const updateDateFilter = (filter: Partial<DateFilterState>) => {
    setState(prev => {
      const newDateFilter = { ...prev.dateFilter, ...filter };
      return {
        ...prev,
        dateFilter: newDateFilter,
        // Clear sorted tasks when filter changes to ensure fresh data
        sortedCompletedTasks: []
      };
    });
  };

  const updateSortedTasks = (tasks: CompletedTaskWithCompletion[]) => {
    setState(prev => ({
      ...prev,
      sortedCompletedTasks: tasks
    }));
  };

  const handleUncompleteTask = (completionId: string) => {
    uncompleteTaskMutation.mutate(completionId, {
      onSuccess: () => {
        refetch();
      }
    });
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTaskMutation.mutate(taskId, {
      onSuccess: () => {
        refetch();
      }
    });
  };

  return {
    // Data
    completedTasks: filteredTasks,
    totalCompletedTasks: filteredTasks.length,

    // State
    expandedTask: state.expandedTask,
    isTasksExpanded: state.isTasksExpanded,
    searchQuery: state.searchQuery,
    dateFilter: state.dateFilter,

    // Loading states
    isLoading,
    error,

    // Actions
    toggleTaskExpansion,
    toggleTasksExpansion,
    updateSearchQuery,
    updateDateFilter,
    updateSortedTasks,
    handleUncompleteTask,
    handleDeleteTask,

    // Utilities
    refetch
  };
};