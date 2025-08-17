import { useState, useCallback } from 'react';

export interface TaskStateConfig<T> {
  expandedTask: string | null;
  isTasksExpanded: boolean;
  sortedTasks: T[];
  searchQuery: string;
}

export const useTaskState = <T>() => {
  const [state, setState] = useState<TaskStateConfig<T>>({
    expandedTask: null,
    isTasksExpanded: false,
    sortedTasks: [],
    searchQuery: '',
  });

  const toggleTaskExpansion = useCallback((taskId: string) => {
    setState(prev => ({
      ...prev,
      expandedTask: prev.expandedTask === taskId ? null : taskId
    }));
  }, []);

  const toggleTasksExpansion = useCallback(() => {
    setState(prev => ({
      ...prev,
      isTasksExpanded: !prev.isTasksExpanded
    }));
  }, []);

  const updateSearchQuery = useCallback((query: string) => {
    setState(prev => ({
      ...prev,
      searchQuery: query,
      sortedTasks: []
    }));
  }, []);

  const updateSortedTasks = useCallback((tasks: T[]) => {
    setState(prev => ({
      ...prev,
      sortedTasks: tasks
    }));
  }, []);

  return {
    state,
    setState,
    toggleTaskExpansion,
    toggleTasksExpansion,
    updateSearchQuery,
    updateSortedTasks,
  };
};