import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { IncompleteTaskWithOverdue } from '../types';
import { getTodayString } from '@/lib/utils/dateUtils';
import { todoApi } from '@/lib/api/todos';
import { todoKeys } from '@/lib/queryKeys';
import { useDateFilterLast7Days, useTaskState, useTaskSorting } from '../../shared';
import { applySearchFilter, applyDateFilter, useTodoMutations } from '../../shared';

export const useIncompleteTasks = () => {
  const { data: incompleteTasks = [], isLoading } = useQuery({
    queryKey: todoKeys.incomplete,
    queryFn: todoApi.getIncomplete,
    refetchOnWindowFocus: true,
  });

  const { dateFilter, updateDateFilter, } = useDateFilterLast7Days();
  const { state, toggleTaskExpansion, toggleTasksExpansion, updateSearchQuery, } = useTaskState<IncompleteTaskWithOverdue>();
  const { setSortConfiguration, applySorting } = useTaskSorting<IncompleteTaskWithOverdue>();
  const { completeTaskMutation, deleteTaskMutation } = useTodoMutations();

  // Process incomplete tasks to add overdue calculation
  const processedIncompleteTasks = useMemo((): IncompleteTaskWithOverdue[] => {
    const currentDate = getTodayString();

    return incompleteTasks.map((task): IncompleteTaskWithOverdue => {
      let overdueDays = 0;
      const relevantDate = task.end_date || task.start_date;

      if (relevantDate) {
        const taskDate = new Date(relevantDate);
        const today = new Date(currentDate);
        const diffTime = today.getTime() - taskDate.getTime();
        overdueDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
      }

      return {
        ...task,
        overdueDays,
        is_incomplete: true
      };
    });
  }, [incompleteTasks]);

  // Apply filtering and sorting
  const filteredTasks = useMemo(() => {
    let filtered = processedIncompleteTasks;

    // Apply search filter
    filtered = applySearchFilter(filtered, state.searchQuery);

    // Apply date filter
    filtered = applyDateFilter(filtered, dateFilter, (task) =>
      task.end_date || task.start_date
    );

    // Apply sorting
    filtered = applySorting(filtered);

    // Default sort by overdue days if no custom sorting
    if (filtered.length > 0) {
      filtered.sort((a, b) => {
        if (a.overdueDays !== b.overdueDays) {
          return b.overdueDays - a.overdueDays;
        }
        const dateA = a.end_date || a.start_date || '';
        const dateB = b.end_date || b.start_date || '';
        return dateA.localeCompare(dateB);
      });
    }

    return filtered;
  }, [processedIncompleteTasks, state.searchQuery, dateFilter, applySorting]);

  // Action handlers
  const handleCompleteTask = (taskId: string) => {
    completeTaskMutation.mutate({ taskId });
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTaskMutation.mutate(taskId);
  };

  const handleClearAllTasks = () => {
    filteredTasks.forEach(task => {
      deleteTaskMutation.mutate(task.id);
    });
  };

  return {
    // Data
    incompleteTasks: filteredTasks,
    totalIncompleteTasks: filteredTasks.length,

    // State
    expandedTask: state.expandedTask,
    isTasksExpanded: state.isTasksExpanded,
    searchQuery: state.searchQuery,
    dateFilter,

    // Loading states
    isLoading,
    error: null,

    // Actions
    toggleTaskExpansion,
    toggleTasksExpansion,
    updateSearchQuery,
    updateDateFilter,
    setSortConfiguration,
    handleCompleteTask,
    handleDeleteTask,
    handleClearAllTasks,
  };
};