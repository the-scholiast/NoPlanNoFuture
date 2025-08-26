import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TaskData } from '@/types/todoTypes';
import { getTodayString } from '@/lib/utils/dateUtils';
import { todoApi } from '@/lib/api/todos';
import { recurringTodoApi } from '@/lib/api/recurringTodosApi';
import { todoKeys } from '@/lib/queryKeys';
import { TodoSection, useTodoMutations } from '../../shared/';
import { filterDailyTasksByDate, filterTasksByDateRange, sortTasksTimeFirst, getRecurringDescription } from '../../shared';
import { formatDate, formatTime, getDateRangeDisplay, getTimeRangeDisplay, isRecurringInstance, sortTasksByField } from '../../shared';

// Business logic for the TodoBoard component
export const useTodoBoard = () => {
  // Direct queries
  const {
    data: allTasks = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: todoKeys.all,
    queryFn: todoApi.getAll,
    refetchOnWindowFocus: true,
  });

  const {
    data: todayTasksWithRecurring = [],
    isLoading: isLoadingTodayRecurring,
  } = useQuery({
    queryKey: todoKeys.today,
    queryFn: recurringTodoApi.getTodayTasks,
    refetchOnWindowFocus: true,
  });

  const {
    data: upcomingTasksWithRecurring = [],
    isLoading: isLoadingUpcomingRecurring,
  } = useQuery({
    queryKey: todoKeys.upcoming,
    queryFn: recurringTodoApi.getUpcomingTasks,
    refetchOnWindowFocus: true,
  });

  const { deleteTaskMutation, refreshAllData } = useTodoMutations();

  // Reset Daily Tasks' completion status after the day ends
  useEffect(() => {
    const checkAndResetDailyTasks = async () => {
      try {
        await todoApi.resetDailyTasks();
        // Refresh all task queries after reset
        refreshAllData();
      } catch (error) {
        console.error('Failed to reset daily tasks:', error);
      }
    };
    checkAndResetDailyTasks();
  }, []);

  // Computed tasks from direct queries
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

  // UI interaction states
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskData | null>(null);
  const [sortedTasks, setSortedTasks] = useState<Record<string, TaskData[]>>({ daily: [], today: [], upcoming: [] });
  const [upcomingFilter, setUpcomingFilter] = useState({ startDate: '', endDate: '', enabled: true });
  const [showAllDailyTasks, setShowAllDailyTasks] = useState(false);

  // Get current date for filtering
  const currentDate: string = useMemo(() => getTodayString(), []);

  // Get current day of week for recurring task filtering
  const currentDayOfWeek = useMemo(() => {
    const today = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return dayNames[today.getDay()];
  }, []);

  // Filtered daily tasks logic - filter by start time default
  const filteredDailyTasks = useMemo(() => {
    const filtered = filterDailyTasksByDate(dailyTasks, currentDate, showAllDailyTasks);
    return sortTasksTimeFirst(filtered);
  }, [dailyTasks, currentDate, currentDayOfWeek, showAllDailyTasks]);

  // Filter upcoming tasks logic - filter by start date default
  const filteredUpcomingTasks = useMemo(() => {
    const filtered = filterTasksByDateRange(upcomingTasks, upcomingFilter);
    return sortTasksByField(filtered, 'start_date', 'asc');
  }, [upcomingTasks, upcomingFilter]);

  const filteredUpcomingRecurringTasks = useMemo(() => {
    const tasks = upcomingTasksWithRecurring.filter(task => task.section !== 'daily');
    const filtered = filterTasksByDateRange(tasks, upcomingFilter);
    return sortTasksTimeFirst(filtered);
  }, [upcomingTasksWithRecurring, upcomingFilter]);

  // Sections configuration
  const sections: TodoSection[] = useMemo(() => [
    {
      title: "Daily Tasks",
      sectionKey: 'daily',
      tasks: sortedTasks.daily.length > 0 ? sortedTasks.daily : filteredDailyTasks,
    },
    {
      title: "Today",
      sectionKey: 'today',
      tasks: sortedTasks.today.length > 0 ? sortedTasks.today : sortTasksTimeFirst(
        todayTasksWithRecurring.filter(task => task.section !== 'daily' && task.section !== 'none')
      ),
    },
    {
      title: "Upcoming",
      sectionKey: 'upcoming',
      tasks: sortedTasks.upcoming.length > 0 ? sortedTasks.upcoming : [
        ...filteredUpcomingTasks.filter(task => task.section !== 'daily'),
        ...filteredUpcomingRecurringTasks
      ],
    }
  ], [filteredDailyTasks, todayTasksWithRecurring, filteredUpcomingTasks, filteredUpcomingRecurringTasks, sortedTasks]);

  // Reset and re-apply sorting when task data changes
  const previousTaskData = useRef<{ daily: string; today: string; upcoming: string; }>({
    daily: '',
    today: '',
    upcoming: ''
  });

  const currentSortConfig = useRef<Record<string, { field: string; order: 'asc' | 'desc' } | null>>({
    daily: null,
    today: null,
    upcoming: null
  });

  useEffect(() => {
    // Create task data signatures that include completion status
    const currentDailyData = filteredDailyTasks.map(t => `${t.id}-${t.completed}`).sort().join(',');
    const currentTodayData = todayTasksWithRecurring
      .filter(task => task.section !== 'daily' && task.section !== 'none')
      .map(t => `${t.id}-${t.completed}`)
      .sort()
      .join(',');
    const currentUpcomingData = [
      ...filteredUpcomingTasks.filter(task => task.section !== 'daily'),
      ...filteredUpcomingRecurringTasks
    ].map(t => `${t.id}-${t.completed}`).sort().join(',');

    // Check if task data has changed (including completion status)
    const hasChanges =
      currentDailyData !== previousTaskData.current.daily ||
      currentTodayData !== previousTaskData.current.today ||
      currentUpcomingData !== previousTaskData.current.upcoming;

    if (hasChanges) {
      previousTaskData.current = {
        daily: currentDailyData,
        today: currentTodayData,
        upcoming: currentUpcomingData
      };

      // Re-apply existing sorts to fresh data
      setSortedTasks(prev => {
        const newSorted = { daily: [] as TaskData[], today: [] as TaskData[], upcoming: [] as TaskData[] };

        // Re-apply daily sort if it exists
        if (prev.daily.length > 0 && currentSortConfig.current.daily) {
          const config = currentSortConfig.current.daily;
          if (config.field === 'start_time') {
            newSorted.daily = sortTasksTimeFirst(filteredDailyTasks, config.order);
          } else {
            newSorted.daily = sortTasksByField(filteredDailyTasks, config.field, config.order);
          }
        }

        // Re-apply today sort if it exists
        if (prev.today.length > 0 && currentSortConfig.current.today) {
          const config = currentSortConfig.current.today;
          const todayTasks = todayTasksWithRecurring.filter(task => task.section !== 'daily' && task.section !== 'none');
          if (config.field === 'start_time') {
            newSorted.today = sortTasksTimeFirst(todayTasks, config.order);
          } else {
            newSorted.today = sortTasksByField(todayTasks, config.field, config.order);
          }
        }

        // Re-apply upcoming sort if it exists
        if (prev.upcoming.length > 0 && currentSortConfig.current.upcoming) {
          const config = currentSortConfig.current.upcoming;
          const upcomingTasks = [
            ...filteredUpcomingTasks.filter(task => task.section !== 'daily'),
            ...filteredUpcomingRecurringTasks
          ];
          if (config.field === 'start_time') {
            newSorted.upcoming = sortTasksTimeFirst(upcomingTasks, config.order);
          } else {
            newSorted.upcoming = sortTasksByField(upcomingTasks, config.field, config.order);
          }
        }

        return newSorted;
      });
    }
  }, [filteredDailyTasks, todayTasksWithRecurring, filteredUpcomingTasks, filteredUpcomingRecurringTasks]);

  const getRecurringPatternDisplay = (task: TaskData) => {
    return getRecurringDescription(task);
  };

  const deleteTask = (taskId: string) => {
    deleteTaskMutation.mutate(taskId);
  };

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTask(expandedTask === taskId ? null : taskId);
  };

  const openEditModal = (task: TaskData) => {
    if (task.id.includes('_') && task.parent_task_id) {
      const editTask = {
        ...task,
        id: task.parent_task_id || task.id.split('_')[0]
      };
      setTaskToEdit(editTask);
    } else {
      setTaskToEdit(task);
    }
    setEditModalOpen(true);
  };

  const handleTasksSort = (sectionKey: string, tasks: TaskData[], sortConfig?: { field: string; order: 'asc' | 'desc' }) => {
    // Store the sort configuration for re-application
    if (sortConfig) {
      currentSortConfig.current[sectionKey] = sortConfig;
    }

    setSortedTasks(prev => ({
      ...prev,
      [sectionKey]: tasks
    }));
  };

  const toggleShowAllDailyTasks = () => {
    setShowAllDailyTasks(prev => !prev);
  };

  // Loading state
  const isAnyLoading = isLoading || isLoadingTodayRecurring || isLoadingUpcomingRecurring;

  // Create fresh task combination for mutations
  const getAllCurrentTasks = () => [
    ...allTasks,
    ...todayTasksWithRecurring,
    ...upcomingTasksWithRecurring
  ];

  return {
    // Data
    sections,
    getAllCurrentTasks,

    // State
    expandedTask,
    editModalOpen,
    setEditModalOpen,
    taskToEdit,
    setUpcomingFilter,
    showAllDailyTasks,

    // Actions
    openEditModal,
    handleTasksSort,
    deleteTask,
    toggleTaskExpansion,
    toggleShowAllDailyTasks,

    // Helper functions
    formatDate,
    formatTime,
    getDateRangeDisplay,
    getTimeRangeDisplay,
    isRecurringInstance,
    getRecurringPatternDisplay,

    // Loading/Error
    isLoading: isAnyLoading,
    error,
  };
}