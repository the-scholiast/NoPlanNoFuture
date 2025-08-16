import { useState, useMemo, } from 'react';
import { CompletedTasksState, DateFilterState, CompletedTaskWithCompletion } from '../../shared/types';
import { getCurrentWeekStart, getCurrentWeekEnd } from '../../shared/utils';
import { useTodoMutations } from '../../shared/hooks/useTodoMutations';
import { useTodo } from '@/contexts/TodoContext';

export const useCompletedTasks = () => {
  const { completedTasks, isLoadingCompletedTasks: isLoading, error } = useTodo();
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

  // Transform context data to component format 
  const processedCompletedTasks = useMemo(() => {
    if (!completedTasks || completedTasks.length === 0) return [];

    return completedTasks.map((item: any): CompletedTaskWithCompletion => ({
      ...item,
      is_recurring_instance: item.is_recurring || false,
      completion_count: item.completion_count
    }));
  }, [completedTasks,]);

  // Apply search filter and sorting
  const filteredTasks = useMemo(() => {
    let filtered = processedCompletedTasks;

    // Apply date filter if enabled
    if (state.dateFilter.enabled && filtered.length > 0) {
      const beforeFilter = filtered.length;
      filtered = filtered.filter(task => {
        const completionDate = task.completion?.completed_at;
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
      const beforeSearch = filtered.length;
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
    const result = filtered;

    return result;
  }, [processedCompletedTasks, state.searchQuery, state.dateFilter, state.sortedCompletedTasks,]);

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
    uncompleteTaskMutation.mutate(completionId);
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTaskMutation.mutate(taskId);
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
    refetch: () => { } // Context handles this
  };
};