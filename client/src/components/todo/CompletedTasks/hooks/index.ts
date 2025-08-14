import { useState, useMemo, useEffect } from 'react';
import { CompletedTasksState, DateFilterState, CompletedTaskWithCompletion } from '../../shared/types';
import { useCompletedTasksMutations } from '../../shared/hooks/useCompletedTasksMutations';
import { getCurrentWeekStart, getCurrentWeekEnd } from '../../shared/utils';
import { useTodo } from '@/contexts/TodoContext';

export const useCompletedTasks = () => {
  // FIXED: Use the correct property name from context
  const { completedTasks, isLoadingCompletedTasks: isLoading, error } = useTodo();

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

  // ADD: Force component update when context data changes
  const [updateTrigger, setUpdateTrigger] = useState(0);
  
  useEffect(() => {
    console.log('🔄 CompletedTasks: Context data changed, forcing update...', completedTasks?.length);
    setUpdateTrigger(prev => prev + 1);
  }, [completedTasks]);

  // Transform context data to component format - ADD updateTrigger dependency
  const processedCompletedTasks = useMemo(() => {
    console.log('🔄 CompletedTasks: Processing context data...', completedTasks?.length || 0, 'trigger:', updateTrigger);
    if (!completedTasks || completedTasks.length === 0) return [];
    
    return completedTasks.map((item: any): CompletedTaskWithCompletion => ({
      ...item,
      is_recurring_instance: item.is_recurring || false,
      completion_count: item.completion_count
    }));
  }, [completedTasks, updateTrigger]); // ADD updateTrigger

  // Apply search filter and sorting - ADD updateTrigger dependency
  const filteredTasks = useMemo(() => {
    let filtered = processedCompletedTasks;

    console.log('🔄 CompletedTasks: Starting filter with', filtered.length, 'tasks, trigger:', updateTrigger);
    console.log('🔄 CompletedTasks: Date filter enabled:', state.dateFilter.enabled);
    console.log('🔄 CompletedTasks: Date range:', state.dateFilter.startDate, 'to', state.dateFilter.endDate);

    // Apply date filter if enabled
    if (state.dateFilter.enabled && filtered.length > 0) {
      const beforeFilter = filtered.length;
      filtered = filtered.filter(task => {
        const completionDate = task.completion?.completed_at;
        if (!completionDate) {
          console.log('⚠️ Task has no completion date:', task);
          return false;
        }
        
        const dateStr = completionDate.split('T')[0];
        const inRange = dateStr >= state.dateFilter.startDate && dateStr <= state.dateFilter.endDate;
        
        return inRange;
      });
      console.log('🔄 CompletedTasks: After date filter:', beforeFilter, '→', filtered.length);
    }

    // Search filter
    if (state.searchQuery.trim()) {
      const query = state.searchQuery.toLowerCase();
      const beforeSearch = filtered.length;
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query)
      );
      console.log('🔄 CompletedTasks: After search filter:', beforeSearch, '→', filtered.length);
    }

    // Sort by completion date (most recent first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.completion.completed_at);
      const dateB = new Date(b.completion.completed_at);
      return dateB.getTime() - dateA.getTime();
    });

    // Use sorted tasks if manually sorted, otherwise use filtered
    const result = filtered;

    console.log('🔄 CompletedTasks: Final filtered result:', result.length);
    return result;
  }, [processedCompletedTasks, state.searchQuery, state.dateFilter, state.sortedCompletedTasks, updateTrigger]);

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
    setState(prev => {
      const newDateFilter = { ...prev.dateFilter, ...filter };
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
    uncompleteTaskMutation.mutate(completionId);
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTaskMutation.mutate(taskId);
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
    refetch: () => {} // Context handles this
  };
};