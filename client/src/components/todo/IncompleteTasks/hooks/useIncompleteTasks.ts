import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { IncompleteTasksState, IncompleteTaskWithOverdue } from '../types';
import { DateFilterState } from '../../shared/types';
import { getCurrentWeekStart, getCurrentWeekEnd } from '../../shared/utils';
import { TaskData } from '@/types/todoTypes';
import { getTodayString } from '@/lib/utils/dateUtils';
import { useTodoMutations } from '../../shared/hooks/useTodoMutations';
import { todoApi } from '@/lib/api/todos';
import { recurringTodoApi } from '@/lib/api/recurringTodosApi';
import { todoKeys } from '@/lib/queryKeys';
import { combineAllTasks, isRecurringInstance } from '../../shared/utils';

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

  // Compute derived data from queries
  const dailyTasks = useMemo(() =>
    allTasks.filter(task => task.section === 'daily'),
    [allTasks]
  );

  const upcomingTasks = useMemo(() => {
    const today = getTodayString();
    return allTasks.filter(task => {
      if (task.section !== 'upcoming') return false;
      if (task.is_recurring) return false;
      return !task.start_date || task.start_date > today;
    });
  }, [allTasks]);

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

  const { toggleTaskFunction, deleteTaskMutation } = useTodoMutations();

  // Calculate current date for overdue calculation
  const currentDate = useMemo(() => getTodayString(), []);

  // Date helpers
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const currentWeek = useMemo(() => ({
    start: getCurrentWeekStart(),
    end: getCurrentWeekEnd()
  }), []);

  const currentMonth = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    return {
      start: `${firstDay.getFullYear()}-${String(firstDay.getMonth() + 1).padStart(2, '0')}-${String(firstDay.getDate()).padStart(2, '0')}`,
      end: `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`
    };
  }, []);

  const allTasksData = combineAllTasks(dailyTasks, todayTasksWithRecurring, upcomingTasks, upcomingTasksWithRecurring);

  // Process incomplete tasks from all sources
  const processedIncompleteTasks = useMemo((): IncompleteTaskWithOverdue[] => {
    const currentDate = getTodayString();
    const allTasksData = [...allTasks, ...todayTasksWithRecurring, ...upcomingTasksWithRecurring];

    return allTasksData
      .filter((task: TaskData) => {
        // Skip completed tasks
        if (task.completed) return false;

        // Skip original recurring tasks to avoid duplicates with instances**
        if (task.is_recurring && !task.id.includes('_')) {
          return false;
        }

        // Rest of existing logic...
        const startDate = task.start_date;
        const endDate = task.end_date;

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

    return filtered;
  }, [processedIncompleteTasks, state.searchQuery, state.dateFilter]);

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
      searchQuery: query,
      // Clear sorted tasks when search changes
      sortedIncompleteTasks: []
    }));
  };

  const updateDateFilter = (filter: Partial<DateFilterState>) => {
    setState(prev => {
      const newDateFilter = { ...prev.dateFilter, ...filter };
      return {
        ...prev,
        dateFilter: newDateFilter,
        // Clear sorted tasks when filter changes to ensure fresh data
        sortedIncompleteTasks: []
      };
    });
  };

  const updateSortedTasks = (tasks: IncompleteTaskWithOverdue[]) => {
    setState(prev => ({
      ...prev,
      sortedIncompleteTasks: tasks
    }));
  };

  const handleCompleteTask = (taskId: string) => {
    // Get all tasks for the toggle function
    const allTasks = combineAllTasks(
      dailyTasks,
      todayTasksWithRecurring,
      upcomingTasks,
      upcomingTasksWithRecurring
    );
    toggleTaskFunction(taskId, allTasks, isRecurringInstance);
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTaskMutation.mutate(taskId);
  };

  const handleClearAllTasks = () => {
    // Delete all incomplete tasks
    filteredTasks.forEach(task => {
      deleteTaskMutation.mutate(task.id);
    });
  };

  // Date filter helper functions
  const handleDateFilterChange = (field: 'startDate' | 'endDate', value: string) => {
    updateDateFilter({ [field]: value });
  };

  const toggleDateFilter = () => {
    updateDateFilter({ enabled: !state.dateFilter.enabled });
  };

  const resetDateFilter = () => {
    updateDateFilter({
      startDate: today,
      endDate: today,
      enabled: true
    });
  };

  const setWeekFilter = () => {
    updateDateFilter({
      startDate: currentWeek.start,
      endDate: currentWeek.end,
      enabled: true
    });
  };

  const setMonthFilter = () => {
    updateDateFilter({
      startDate: currentMonth.start,
      endDate: currentMonth.end,
      enabled: true
    });
  };

  const clearDateFilter = () => {
    updateDateFilter({ enabled: false });
  };

  const getFilterDisplayText = () => {
    if (!state.dateFilter.enabled) return 'All dates';

    const formatLocalDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString();
    };

    if (state.dateFilter.startDate === state.dateFilter.endDate &&
      state.dateFilter.startDate === today) {
      return 'Today only';
    }

    if (state.dateFilter.startDate === currentWeek.start &&
      state.dateFilter.endDate === currentWeek.end) {
      return 'This week';
    }

    if (state.dateFilter.startDate === currentMonth.start &&
      state.dateFilter.endDate === currentMonth.end) {
      return 'This month';
    }

    if (state.dateFilter.startDate === state.dateFilter.endDate) {
      return formatLocalDate(state.dateFilter.startDate);
    }

    return `${formatLocalDate(state.dateFilter.startDate)} - ${formatLocalDate(state.dateFilter.endDate)}`;
  };

  // Combined loading state
  const isLoading = isLoadingAll || isLoadingToday || isLoadingUpcoming;

  return {
    // Data
    incompleteTasks: state.sortedIncompleteTasks.length > 0 ? state.sortedIncompleteTasks : filteredTasks,
    totalIncompleteTasks: state.sortedIncompleteTasks.length > 0 ? state.sortedIncompleteTasks.length : filteredTasks.length,

    // State
    expandedTask: state.expandedTask,
    isTasksExpanded: state.isTasksExpanded,
    searchQuery: state.searchQuery,
    dateFilter: state.dateFilter,

    // Loading states
    isLoading,
    error: null, // Individual queries handle their own errors

    // Actions
    toggleTaskExpansion,
    toggleTasksExpansion,
    updateSearchQuery,
    updateDateFilter,
    updateSortedTasks,
    handleCompleteTask,
    handleDeleteTask,
    handleClearAllTasks,

    // Date filter functions
    handleDateFilterChange,
    toggleDateFilter,
    resetDateFilter,
    setWeekFilter,
    setMonthFilter,
    clearDateFilter,
    getFilterDisplayText,
  };
};