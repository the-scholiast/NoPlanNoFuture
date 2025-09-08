import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DeletedTaskWithInfo } from '../types';
import { getTodayString } from '@/lib/utils/dateUtils';
import { todoApi } from '@/lib/api/todos';
import { todoKeys } from '@/lib/queryKeys';
import { useTodoMutations } from '../../shared';
import { useDateFilterCurrentMonth, useTaskState } from '../../shared/hooks/';
import { applySearchFilter, applyDateFilter } from '../../shared/utils/';

export const useDeletedTasks = () => {
  // Direct query for deleted tasks
  const { data: deletedTasks = [], isLoading, error } = useQuery({
    queryKey: todoKeys.deleted,
    queryFn: () => todoApi.getDeleted(),
    refetchOnWindowFocus: true,
  });

  const { dateFilter, updateDateFilter } = useDateFilterCurrentMonth();
  const { state, toggleTaskExpansion, toggleTasksExpansion, updateSearchQuery } = useTaskState<DeletedTaskWithInfo>();
  const { restoreTaskMutation, permanentDeleteTaskMutation, deleteTaskOverrideMutation } = useTodoMutations();

  // Process deleted tasks to add deleted days calculation
  const processedDeletedTasks = useMemo((): DeletedTaskWithInfo[] => {
    const currentDate = getTodayString();

    return deletedTasks.map((task): DeletedTaskWithInfo => {
      let deletedDays = 0;

      if (task.deleted_at) {
        const deletedDate = new Date(task.deleted_at);
        const today = new Date(currentDate);
        const diffTime = today.getTime() - deletedDate.getTime();
        deletedDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
      }

      return {
        ...task,
        deletedDays,
        is_deleted: true
      };
    });
  }, [deletedTasks]);

  // Apply filtering and sorting
  const filteredTasks = useMemo(() => {
    let filtered = processedDeletedTasks;

    // Apply search filter
    filtered = applySearchFilter(filtered, state.searchQuery);

    // Apply date filter based on deleted_at
    filtered = applyDateFilter(filtered, dateFilter, (task) => task.deleted_at);

    // Sort by most recently deleted first
    filtered.sort((a, b) => {
      const dateA = new Date(a.deleted_at || '');
      const dateB = new Date(b.deleted_at || '');
      return dateB.getTime() - dateA.getTime();
    });

    return filtered;
  }, [processedDeletedTasks, state.searchQuery, dateFilter]);

  // Action handlers
  const handleRestoreTask = (taskId: string) => {
    restoreTaskMutation.mutate(taskId);
  };

  const handlePermanentDeleteTask = (taskId: string) => {
    permanentDeleteTaskMutation.mutate(taskId);
    deleteTaskOverrideMutation.mutate(taskId);
  };

  const handleClearAllTasks = () => {
    filteredTasks.forEach(task => {
      permanentDeleteTaskMutation.mutate(task.id);
    });
  };

  return {
    // Data
    deletedTasks: filteredTasks,
    totalDeletedTasks: filteredTasks.length,

    // State
    expandedTask: state.expandedTask,
    isTasksExpanded: state.isTasksExpanded,
    searchQuery: state.searchQuery,
    dateFilter,

    // Loading states
    isLoading,
    error,

    // Actions
    toggleTaskExpansion,
    toggleTasksExpansion,
    updateSearchQuery,
    updateDateFilter,
    handleRestoreTask,
    handlePermanentDeleteTask,
    handleClearAllTasks,
  };
};