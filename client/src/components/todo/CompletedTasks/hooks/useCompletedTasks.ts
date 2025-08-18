import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CompletedTaskWithCompletion } from '../../shared/types';
import { todoCompletionsApi } from '@/lib/api/todoCompletions';
import { useTodoMutations } from '../../shared';
import { todoKeys } from '@/lib/queryKeys';
import { useDateFilter, useTaskState, useTaskSorting } from '../../shared/hooks/';
import { applySearchFilter, applyDateFilter } from '../../shared/utils/';

export const useCompletedTasks = () => {
  // Direct query instead of context
  const { data: completedTasks = [], isLoading, error } = useQuery({
    queryKey: todoKeys.completed,
    queryFn: () => todoCompletionsApi.getCompletedTasks(),
    refetchOnWindowFocus: true,
  });

  const { deleteTaskMutation, uncompleteTaskMutation } = useTodoMutations();
  const { dateFilter, updateDateFilter, } = useDateFilter();
  const { state, toggleTaskExpansion, toggleTasksExpansion, updateSearchQuery, } = useTaskState<CompletedTaskWithCompletion>();
  const { setSortConfiguration, applySorting } = useTaskSorting<CompletedTaskWithCompletion>();

  // Transform query data to component format 
  const processedCompletedTasks = useMemo(() => {
    if (!completedTasks || completedTasks.length === 0) return [];

    return completedTasks.map((item: any): CompletedTaskWithCompletion => ({
      ...item,
      is_recurring_instance: item.is_recurring || false,
      completion_count: item.completion_count
    }));
  }, [completedTasks]);

  // Apply filtering and sorting
  const filteredTasks = useMemo(() => {
    let filtered = processedCompletedTasks;

    // Apply date filter
    filtered = applyDateFilter(filtered, dateFilter, (task) =>
      task.completion?.completed_at || task.completed_at
    );

    // Apply search filter
    filtered = applySearchFilter(filtered, state.searchQuery);

    // Apply sorting
    filtered = applySorting(filtered);

    // Default sort if no custom sorting
    if (!filtered.length) {
      filtered.sort((a, b) => {
        const dateA = new Date(a.completion?.completed_at || a.completed_at || '');
        const dateB = new Date(b.completion?.completed_at || b.completed_at || '');
        return dateB.getTime() - dateA.getTime();
      });
    }

    return filtered;
  }, [processedCompletedTasks, state.searchQuery, dateFilter, applySorting]);

  // Action handlers
  const handleUncompleteTask = (completionId: string) => {
    uncompleteTaskMutation.mutate(completionId);
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
    completedTasks: filteredTasks,
    totalCompletedTasks: filteredTasks.length,

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
    setSortConfiguration,
    handleUncompleteTask,
    handleDeleteTask,
    handleClearAllTasks,
  };
};