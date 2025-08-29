import { useState, useCallback } from 'react';
import { TaskData } from '@/types/todoTypes';
import { sortTasksByField } from '../utils/taskSortingUtils';

export const useTaskSorting = <T extends TaskData>() => {
  // Current sort configuration (field and direction)
  const [sortConfig, setSortConfig] = useState<{ field: string, order: 'asc' | 'desc' } | null>(null);
  // Update sort configuration with field and order
  const setSortConfiguration = useCallback((field: string, order: 'asc' | 'desc') => {
    setSortConfig({ field, order });
  }, []);
  // Apply current sort configuration to task array
  const applySorting = useCallback((tasks: T[]): T[] => {
    if (!sortConfig) return tasks;

    const sortedTasks = sortTasksByField(tasks, sortConfig.field, sortConfig.order); // Use generic field sorting 

    return sortedTasks;
  }, [sortConfig]);

  return {
    setSortConfiguration,
    applySorting,
  };
};