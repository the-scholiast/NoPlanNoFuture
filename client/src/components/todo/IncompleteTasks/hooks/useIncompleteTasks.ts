import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { IncompleteTaskWithOverdue } from '../types';
import { TaskData } from '@/types/todoTypes';
import { getTodayString } from '@/lib/utils/dateUtils';
import { todoApi } from '@/lib/api/todos';
import { recurringTodoApi } from '@/lib/api/recurringTodosApi';
import { todoKeys } from '@/lib/queryKeys';
import { useTodoMutations } from '../../shared';
import { useDateFilter, useTaskState, useTaskSorting } from '../../shared/hooks/';
import { applySearchFilter, applyDateFilter } from '../../shared/utils/';

export const useIncompleteTasks = () => {
  // Direct queries instead of context
  const { data: allTasks = [], isLoading: isLoadingAll } = useQuery({
    queryKey: todoKeys.all,
    queryFn: todoApi.getAll,
  });

  const { data: todayTasksWithRecurring = [], isLoading: isLoadingToday } = useQuery({
    queryKey: todoKeys.today,
    queryFn: recurringTodoApi.getTodayTasks,
  });

  const { data: upcomingTasksWithRecurring = [], isLoading: isLoadingUpcoming } = useQuery({
    queryKey: todoKeys.upcoming,
    queryFn: recurringTodoApi.getUpcomingTasks,
  });
  // Shared functions
  const { dateFilter, updateDateFilter, } = useDateFilter();
  const { state, toggleTaskExpansion, toggleTasksExpansion, updateSearchQuery, } = useTaskState<IncompleteTaskWithOverdue>();
  const { setSortConfiguration, applySorting } = useTaskSorting<IncompleteTaskWithOverdue>();
  const { completeTaskMutation, deleteTaskMutation } = useTodoMutations();

  // Process incomplete tasks from all sources
  const processedIncompleteTasks = useMemo((): IncompleteTaskWithOverdue[] => {
    const currentDate = getTodayString();
    const allTasksData = [...allTasks, ...todayTasksWithRecurring, ...upcomingTasksWithRecurring];

    return allTasksData
      .filter((task: TaskData) => {
        if (task.completed) return false;
        if (task.completion_count && task.completion_count > 0) return false;
        if (task.is_recurring && !task.id.includes('_')) return false;

        const startDate = task.start_date;
        const endDate = task.end_date;

        if (startDate && !endDate) return startDate < currentDate;
        if (startDate && endDate) return endDate < currentDate;
        if (!startDate && endDate) return endDate < currentDate;

        return false;
      })
      .map((task: TaskData): IncompleteTaskWithOverdue => {
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
  }, [allTasks, todayTasksWithRecurring, upcomingTasksWithRecurring]);

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

    // Default sort if no custom sorting
    if (!filtered.length) {
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

  const isLoading = isLoadingAll || isLoadingToday || isLoadingUpcoming;

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