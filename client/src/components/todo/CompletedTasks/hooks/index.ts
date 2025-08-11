import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CompletedTasksState, DateFilterState, CompletedTaskWithCompletion } from '../../shared/types';
import { useCompletedTasksMutations } from '../../shared/hooks/useCompletedTasksMutations';
import { getCurrentWeekStart, getCurrentWeekEnd } from '../../shared/utils';
import { todoCompletionsApi, CompletedTaskWithDetails } from '@/lib/api/todoCompletions';

export const useCompletedTasks = () => {
  // Component state
  const [state, setState] = useState<CompletedTasksState>({
    expandedTask: null,
    isTasksExpanded: false,
    sortedCompletedTasks: [],
    searchQuery: '',
    dateFilter: {
      startDate: getCurrentWeekStart(),
      endDate: getCurrentWeekEnd(),
      enabled: true
    }
  });

  // Create a stable query key that changes when date filter changes
  const queryKey = useMemo(() => [
    'completed-tasks',
    state.dateFilter.enabled,
    state.dateFilter.startDate,
    state.dateFilter.endDate
  ], [state.dateFilter.enabled, state.dateFilter.startDate, state.dateFilter.endDate]);

  // Query for completed tasks with completions
  const {
    data: completedTasksData = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: () => {
      console.log('🔄 Fetching completed tasks with filter:', {
        enabled: state.dateFilter.enabled,
        startDate: state.dateFilter.startDate,
        endDate: state.dateFilter.endDate
      });

      if (state.dateFilter.enabled) {
        return todoCompletionsApi.getCompletionsInRange(
          state.dateFilter.startDate,
          state.dateFilter.endDate
        );
      }
      return todoCompletionsApi.getCompletedTasks();
    },
    staleTime: 1000 * 60 * 2, // Reduced to 2 minutes for better debugging
  });

  // Log data changes for debugging
  useEffect(() => {
    console.log('📊 Completed tasks data updated:', {
      count: completedTasksData.length,
      filter: state.dateFilter,
      timestamp: new Date().toISOString()
    });
  }, [completedTasksData, state.dateFilter]);

  // Transform API data to component format
  const processedCompletedTasks = useMemo(() => {
    return completedTasksData.map((item: CompletedTaskWithDetails): CompletedTaskWithCompletion => ({
      ...item,
      is_recurring_instance: item.is_recurring || false,
      completion_count: item.completion_count
    }));
  }, [completedTasksData]);

  // Apply search filter and sorting
  const filteredTasks = useMemo(() => {
    let filtered = processedCompletedTasks;

    console.log('🧹 Starting with tasks:', filtered.length);

    // Search filter
    if (state.searchQuery.trim()) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
      );
      console.log('🔍 After search filter:', filtered.length);
    }

    // Apply date filter if enabled - This should be redundant now since API handles it
    // But keeping as a safety net for client-side data that might slip through
    if (state.dateFilter.enabled && filtered.length > 0) {
      const initialCount = filtered.length;
      filtered = filtered.filter(task => {
        const completionDate = task.completion.completed_at;
        if (!completionDate) {
          console.log('⚠️ Task without completion date:', task.id);
          return false;
        }

        // Extract just the date part if it includes timestamp
        const taskDateStr = completionDate.includes('T') ?
          completionDate.split('T')[0] : completionDate;

        const isInRange = taskDateStr >= state.dateFilter.startDate &&
          taskDateStr <= state.dateFilter.endDate;

        if (!isInRange) {
          console.log('🚫 Filtering out task:', {
            taskId: task.id,
            taskDate: taskDateStr,
            filterStart: state.dateFilter.startDate,
            filterEnd: state.dateFilter.endDate
          });
        }

        return isInRange;
      });

      if (initialCount !== filtered.length) {
        console.log(`🧹 Client-side date filter: ${initialCount} → ${filtered.length}`);
      }
    }

    // Sort by completion date (most recent first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.completion.completed_at);
      const dateB = new Date(b.completion.completed_at);
      return dateB.getTime() - dateA.getTime();
    });

    // Use sorted tasks if manually sorted, otherwise use filtered
    const result = state.sortedCompletedTasks.length > 0 ? state.sortedCompletedTasks : filtered;

    console.log('✅ Final filtered tasks:', result.length);
    return result;
  }, [processedCompletedTasks, state.searchQuery, state.dateFilter, state.sortedCompletedTasks]);

  // Get mutations
  const { uncompleteTaskMutation, deleteTaskMutation } = useCompletedTasksMutations();

  // Action handlers
  const toggleTaskExpansion = (completionId: string) => {
    setState(prev => ({
      ...prev,
      expandedTask: prev.expandedTask === completionId ? null : completionId
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
    console.log('🔧 updateDateFilter called with:', filter);
    setState(prev => {
      const newDateFilter = { ...prev.dateFilter, ...filter };
      console.log('🔧 Date filter updated:', { old: prev.dateFilter, new: newDateFilter });
      return {
        ...prev,
        dateFilter: newDateFilter,
        // Clear sorted tasks when filter changes to ensure fresh data
        sortedCompletedTasks: []
      };
    });
  };

  const updateSortedTasks = (tasks: CompletedTaskWithCompletion[]) => {
    setState(prev => ({
      ...prev,
      sortedCompletedTasks: tasks
    }));
  };

  const handleUncompleteTask = (completionId: string) => {
    uncompleteTaskMutation.mutate(completionId, {
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
    completedTasks: filteredTasks,
    totalCompletedTasks: filteredTasks.length,

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
    handleUncompleteTask,
    handleDeleteTask,

    // Utilities
    refetch
  };
};