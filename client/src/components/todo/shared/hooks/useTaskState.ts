import { useState, useCallback } from 'react';

export interface TaskStateConfig<T> {
  expandedTask: string | null;
  isTasksExpanded: boolean;
  sortedTasks: T[];
  searchQuery: string;
}

export const useTaskState = <T>() => {
  // Manages task UI state including expansion, search, and sorting
  const [state, setState] = useState<TaskStateConfig<T>>({
    expandedTask: null,
    isTasksExpanded: false,
    sortedTasks: [],
    searchQuery: '',
  });
  // Toggle individual task expansion (collapse if already expanded)
  const toggleTaskExpansion = useCallback((taskId: string) => {
    setState(prev => ({
      ...prev,
      expandedTask: prev.expandedTask === taskId ? null : taskId
    }));
  }, []);
  // Toggle expand/collapse all tasks
  const toggleTasksExpansion = useCallback(() => {
    setState(prev => ({
      ...prev,
      isTasksExpanded: !prev.isTasksExpanded
    }));
  }, []);
  // Update search query and reset sorted tasks
  const updateSearchQuery = useCallback((query: string) => {
    setState(prev => ({
      ...prev,
      searchQuery: query,
      sortedTasks: [] // Reset sorting when search changes
    }));
  }, []);

  return {
    state,
    toggleTaskExpansion,
    toggleTasksExpansion,
    updateSearchQuery,
  };
};