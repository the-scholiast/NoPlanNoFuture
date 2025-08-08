import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
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

  // Query for completed tasks with completions
  const {
    data: completedTasksData = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['completed-tasks', state.dateFilter],
    queryFn: () => {
      if (state.dateFilter.enabled) {
        return todoCompletionsApi.getCompletionsInRange(
          state.dateFilter.startDate,
          state.dateFilter.endDate
        );
      }
      return todoCompletionsApi.getCompletedTasks();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
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

    // Apply date filter if enabled (this is now handled by the query, but keeping for client-side refinement)
    if (state.dateFilter.enabled && filtered.length > 0) {
      filtered = filtered.filter(task => {
        const completionDate = task.completion.instance_date;
        if (!completionDate) return false;

        // Extract just the date part if it includes timestamp
        const taskDateStr = completionDate.includes('T') ?
          completionDate.split('T')[0] : completionDate;

        return taskDateStr >= state.dateFilter.startDate &&
          taskDateStr <= state.dateFilter.endDate;
      });
    }

    // Sort by completion date (most recent first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.completion.completed_at);
      const dateB = new Date(b.completion.completed_at);
      return dateB.getTime() - dateA.getTime();
    });

    // Use sorted tasks if manually sorted, otherwise use filtered
    return state.sortedCompletedTasks.length > 0 ? state.sortedCompletedTasks : filtered;
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
    setState(prev => ({
      ...prev,
      dateFilter: { ...prev.dateFilter, ...filter }
    }));
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