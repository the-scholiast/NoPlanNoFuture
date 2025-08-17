import { useState, useCallback } from 'react';
import { TaskData } from '@/types/todoTypes';
import { sortTasksTimeFirst, sortTasksByField } from '../utils/taskSortingUtils';

export const useTaskSorting = <T extends TaskData>() => {
  const [sortConfig, setSortConfig] = useState<{ field: string, order: 'asc' | 'desc' } | null>(null);

  const setSortConfiguration = useCallback((field: string, order: 'asc' | 'desc') => {
    setSortConfig({ field, order });
  }, []);

  const applySorting = useCallback((tasks: T[]): T[] => {
    if (!sortConfig) return tasks;

    let sortedTasks: T[];
    if (sortConfig.field === 'start_time') {
      sortedTasks = sortTasksTimeFirst(tasks, sortConfig.order);
    } else {
      sortedTasks = sortTasksByField(tasks, sortConfig.field, sortConfig.order);
    }
    return sortedTasks;
  }, [sortConfig]);

  return {
    sortConfig,
    setSortConfiguration,
    applySorting,
  };
};