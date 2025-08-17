import { useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CompletedTasksState, DateRangeFilter, CompletedTaskWithCompletion } from '../../shared/types';
import { getCurrentWeekStart, getCurrentWeekEnd, } from '../../shared/utils';
import { todoCompletionsApi } from '@/lib/api/todoCompletions';
import { useTodoMutations } from '../../shared';
import { todoKeys } from '@/lib/queryKeys';
import { sortTasksTimeFirst, sortTasksByField } from '../../shared/utils/taskSortingUtils';

export const useCompletedTasks = () => {
  const queryClient = useQueryClient();
  // Direct query instead of context
  const { data: completedTasks = [], isLoading, error } = useQuery({
    queryKey: todoKeys.completed,
    queryFn: () => todoCompletionsApi.getCompletedTasks(),
    staleTime: 0, // Always refetch to get latest data
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const { deleteTaskMutation, uncompleteTaskMutation } = useTodoMutations();

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

  // ADD: Sort configuration state
  const [sortConfig, setSortConfig] = useState<{ field: string, order: 'asc' | 'desc' } | null>(null);

  // Date helpers
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const currentWeek = useMemo(() => ({
    start: getCurrentWeekStart(),
    end: getCurrentWeekEnd()
  }), []);

  const currentMonth = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    return {
      start: `${firstDay.getFullYear()}-${String(firstDay.getMonth() + 1).padStart(2, '0')}-${String(firstDay.getDate()).padStart(2, '0')}`,
      end: `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`
    };
  }, []);

  // Transform query data to component format 
  const processedCompletedTasks = useMemo(() => {
    if (!completedTasks || completedTasks.length === 0) return [];

    return completedTasks.map((item: any): CompletedTaskWithCompletion => ({
      ...item,
      is_recurring_instance: item.is_recurring || false,
      completion_count: item.completion_count
    }));
  }, [completedTasks]);

  // Apply search filter and sorting
  const filteredTasks = useMemo(() => {
    let filtered = processedCompletedTasks;

    // Apply date filter if enabled
    if (state.dateFilter.enabled && filtered.length > 0) {
      filtered = filtered.filter(task => {
        // Handle both direct completion date and nested completion object
        const completionDate = task.completion?.completed_at || task.completed_at;
        if (!completionDate) {
          console.log('⚠️ Task has no completion date:', task);
          return false;
        }

        const dateStr = completionDate.split('T')[0];
        const inRange = dateStr >= state.dateFilter.startDate && dateStr <= state.dateFilter.endDate;

        return inRange;
      });
    }

    // Search filter
    if (state.searchQuery.trim()) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
      );
    }

    // Apply sorting if configured
    if (sortConfig) {
      if (sortConfig.field === 'start_time') {
        filtered = sortTasksTimeFirst([...filtered], sortConfig.order) as CompletedTaskWithCompletion[];
      } else {
        filtered = sortTasksByField([...filtered], sortConfig.field, sortConfig.order) as CompletedTaskWithCompletion[];
      }
    } else {
      // Default sort by completion date (most recent first)
      filtered.sort((a, b) => {
        const dateA = new Date(a.completion?.completed_at || a.completed_at || '');
        const dateB = new Date(b.completion?.completed_at || b.completed_at || '');
        return dateB.getTime() - dateA.getTime();
      });
    }

    return filtered;
  }, [processedCompletedTasks, state.searchQuery, state.dateFilter, sortConfig]);

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
      searchQuery: query,
      // Clear sorted tasks when search changes
      sortedCompletedTasks: []
    }));
  };

  const updateDateFilter = (filter: Partial<DateRangeFilter>) => {
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

  const updateSortedTasks = useCallback((tasks: CompletedTaskWithCompletion[]) => {
    // Do nothing - we handle sorting differently now
  }, []);

  // ADD: Stable sort configuration setter
  const setSortConfiguration = useCallback((field: string, order: 'asc' | 'desc') => {
    setSortConfig({ field, order });
  }, []);

  const handleUncompleteTask = (completionId: string) => {
    uncompleteTaskMutation.mutate(completionId);
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTaskMutation.mutate(taskId);
  };

  // Date filter helper functions
  const handleDateFilterChange = (field: 'startDate' | 'endDate', value: string) => {
    updateDateFilter({ [field]: value });
  };

  const toggleDateFilter = () => {
    updateDateFilter({ enabled: !state.dateFilter.enabled });
  };

  const resetDateFilter = () => {
    updateDateFilter({
      startDate: today,
      endDate: today,
      enabled: true
    });
  };

  const setWeekFilter = () => {
    updateDateFilter({
      startDate: currentWeek.start,
      endDate: currentWeek.end,
      enabled: true
    });
  };

  const setMonthFilter = () => {
    updateDateFilter({
      startDate: currentMonth.start,
      endDate: currentMonth.end,
      enabled: true
    });
  };

  const clearDateFilter = () => {
    updateDateFilter({ enabled: false });
  };

  const getFilterDisplayText = () => {
    if (!state.dateFilter.enabled) return 'All dates';

    const formatLocalDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString();
    };

    if (state.dateFilter.startDate === state.dateFilter.endDate &&
      state.dateFilter.startDate === today) {
      return 'Today only';
    }

    if (state.dateFilter.startDate === currentWeek.start &&
      state.dateFilter.endDate === currentWeek.end) {
      return 'This week';
    }

    if (state.dateFilter.startDate === currentMonth.start &&
      state.dateFilter.endDate === currentMonth.end) {
      return 'This month';
    }

    if (state.dateFilter.startDate === state.dateFilter.endDate) {
      return formatLocalDate(state.dateFilter.startDate);
    }

    return `${formatLocalDate(state.dateFilter.startDate)} - ${formatLocalDate(state.dateFilter.endDate)}`;
  };

  const handleClearAllTasks = () => {
    // Delete all completed tasks
    filteredTasks.forEach(task => {
      deleteTaskMutation.mutate(task.id);
    });
  };

  return {
    // Data - Use filtered tasks (now includes sorting)
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
    setSortConfiguration, // ADD this
    handleUncompleteTask,
    handleDeleteTask,
    handleClearAllTasks,

    // Date filter functions
    handleDateFilterChange,
    toggleDateFilter,
    resetDateFilter,
    setWeekFilter,
    setMonthFilter,
    clearDateFilter,
    getFilterDisplayText,
  };
};