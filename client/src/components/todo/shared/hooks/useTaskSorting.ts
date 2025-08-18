import { useState, useCallback } from 'react';
import { TaskData } from '@/types/todoTypes';
import { sortTasksTimeFirst, sortTasksByField } from '../utils/taskSortingUtils';

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

    let sortedTasks: T[];
    if (sortConfig.field === 'start_time') {
      sortedTasks = sortTasksTimeFirst(tasks, sortConfig.order); // Use time-based sorting for start_time field
    } else {
      sortedTasks = sortTasksByField(tasks, sortConfig.field, sortConfig.order); // Use generic field sorting for other fields
    }
    return sortedTasks;
  }, [sortConfig]);

  return {
    setSortConfiguration,
    applySorting,
  };
};