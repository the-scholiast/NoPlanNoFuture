import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { IncompleteTasksState, IncompleteTaskWithOverdue } from '../types';
import { DateFilterState } from '../../shared/types';
import { useIncompleteTasksMutations } from '../../shared/hooks/useIncompleteTasksMutations';
import { getCurrentWeekStart, getCurrentWeekEnd } from '../../shared/utils';
import { todoApi } from '@/lib/api/todos';
import { TaskData } from '@/types/todoTypes';

export const useIncompleteTasks = () => {
  // Component state
  const [state, setState] = useState<IncompleteTasksState>({
    expandedTask: null,
    isTasksExpanded: false,
    sortedIncompleteTasks: [],
    searchQuery: '',
    dateFilter: {
      startDate: getCurrentWeekStart(),
      endDate: getCurrentWeekEnd(),
      enabled: true
    }
  });

  // Query for all tasks
  const {
    data: allTasksData = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => todoApi.getAll(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Calculate current date for overdue calculation
  const currentDate = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  // Filter and transform tasks to show incomplete/overdue ones
  const processedIncompleteTasks = useMemo(() => {
    return allTasksData
      .filter((task: TaskData) => {
        // Skip completed or deleted tasks
        if (task.completed || task.deleted_at) return false;

        // Check if task is incomplete based on date criteria
        const startDate = task.start_date;
        const endDate = task.end_date;

        // If no dates, not considered incomplete
        if (!startDate && !endDate) return false;

        // Case 1: Has start_date but no end_date - incomplete if start_date < current_date
        if (startDate && !endDate) {
          return startDate < currentDate;
        }

        // Case 2: Has both start_date and end_date - incomplete if both < current_date
        if (startDate && endDate) {
          return endDate < currentDate;
        }

        // Case 3: Has end_date but no start_date - incomplete if end_date < current_date
        if (!startDate && endDate) {
          return endDate < currentDate;
        }

        return false;
      })
      .map((task: TaskData): IncompleteTaskWithOverdue => {
        // Calculate overdue days
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
  }, [allTasksData, currentDate]);

  // Apply search filter and date filter
  const filteredTasks = useMemo(() => {
    let filtered = processedIncompleteTasks;

    // Search filter
    if (state.searchQuery.trim()) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
      );
    }

    // Apply date filter if enabled
    if (state.dateFilter.enabled && filtered.length > 0) {
      filtered = filtered.filter(task => {
        // Filter based on the task's relevant date (end_date or start_date)
        const relevantDate = task.end_date || task.start_date;
        if (!relevantDate) return false;

        const taskDateStr = relevantDate.includes('T') ? 
          relevantDate.split('T')[0] : relevantDate;

        return taskDateStr >= state.dateFilter.startDate &&
          taskDateStr <= state.dateFilter.endDate;
      });
    }

    // Sort by overdue days (most overdue first), then by date
    filtered.sort((a, b) => {
      // First sort by overdue days (descending)
      if (a.overdueDays !== b.overdueDays) {
        return b.overdueDays - a.overdueDays;
      }

      // Then sort by relevant date (earliest first)
      const dateA = a.end_date || a.start_date || '';
      const dateB = b.end_date || b.start_date || '';
      return dateA.localeCompare(dateB);
    });

    // Use sorted tasks if manually sorted, otherwise use filtered
    return state.sortedIncompleteTasks.length > 0 ? state.sortedIncompleteTasks : filtered;
  }, [processedIncompleteTasks, state.searchQuery, state.dateFilter, state.sortedIncompleteTasks]);

  // Get mutations
  const { completeTaskMutation, deleteTaskMutation } = useIncompleteTasksMutations();

  // Action handlers
  const toggleTaskExpansion = (taskId: string) => {
    setState(prev => ({
      ...prev,
      expandedTask: prev.expandedTask === taskId ? null : taskId
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
    setState(prev => ({
      ...prev,
      dateFilter: { ...prev.dateFilter, ...filter }
    }));
  };

  const updateSortedTasks = (tasks: IncompleteTaskWithOverdue[]) => {
    setState(prev => ({
      ...prev,
      sortedIncompleteTasks: tasks
    }));
  };

  const handleCompleteTask = (taskId: string) => {
    completeTaskMutation.mutate(taskId, {
      onSuccess: () => {
        refetch();
      }
    });
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTaskMutation.mutate(taskId, {
      onSuccess: () => {
        refetch();
      }
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
    handleCompleteTask,
    handleDeleteTask,

    // Utilities
    refetch
  };
};