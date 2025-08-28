import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TaskData } from '@/types/todoTypes';
import { getTodayString } from '@/lib/utils/dateUtils';
import { todoApi } from '@/lib/api/todos';
import { recurringTodoApi } from '@/lib/api/recurringTodosApi';
import { todoKeys } from '@/lib/queryKeys';
import { TodoSection, useTodoMutations } from '../../shared/';
import { filterDailyTasksByDate, filterTasksByDateRange, getRecurringDescription } from '../../shared';
import { getDateRangeDisplay, getTimeRangeDisplay, isRecurringInstance, sortTasksByField } from '../../shared';

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
    data: upcomingTasks = [],
    isLoading: isLoadingUpcomingRecurring,
  } = useQuery({
    queryKey: todoKeys.upcoming,
    queryFn: todoApi.getUpcoming,
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

  // UI interaction states
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskData | null>(null);
  const [upcomingFilter, setUpcomingFilter] = useState({ startDate: '', endDate: '', enabled: true });
  const [showAllDailyTasks, setShowAllDailyTasks] = useState(false);
  const [sortConfigs, setSortConfigs] = useState<Record<string, { field: string; order: 'asc' | 'desc' } | null>>({
    daily: null,
    today: null,
    upcoming: null
  });

  // Get current date for filtering
  const currentDate: string = useMemo(() => getTodayString(), []);

  // Filtered daily tasks logic - filter by start time default
  const filteredDailyTasks = useMemo(() => {
    const filtered = filterDailyTasksByDate(dailyTasks, currentDate, showAllDailyTasks);
    return sortTasksByField(filtered, 'start_time', 'asc');
  }, [dailyTasks, currentDate, showAllDailyTasks]);

  // Filter upcoming tasks logic - filter by start date default
  const filteredUpcomingTasks = useMemo(() => {
    const filtered = filterTasksByDateRange(upcomingTasks, upcomingFilter);
    return sortTasksByField(filtered, 'start_date', 'asc');
  }, [upcomingTasks, upcomingFilter]);

  const filteredTodayTasks = useMemo(() => {
    const tasks = todayTasksWithRecurring.filter(task => task.section !== 'daily' && task.section !== 'none');
    return sortTasksByField(tasks, 'start_time', 'asc')
  }, [todayTasksWithRecurring]);

  // Sections configuration
  const sections: TodoSection[] = useMemo(() => {
    const getSortedTasks = (tasks: TaskData[], sectionKey: string) => {
      const config = sortConfigs[sectionKey];
      if (!config) return tasks;

      return sortTasksByField(tasks, config.field, config.order);
    };

    return [
      {
        title: "Daily",
        sectionKey: 'daily',
        tasks: getSortedTasks(filteredDailyTasks, 'daily'),
      },
      {
        title: "Today",
        sectionKey: 'today',
        tasks: getSortedTasks(filteredTodayTasks, 'today'),
      },
      {
        title: "Upcoming",
        sectionKey: 'upcoming',
        tasks: getSortedTasks(filteredUpcomingTasks, 'upcoming'),
      }
    ];
  }, [filteredDailyTasks, filteredTodayTasks, filteredUpcomingTasks, sortConfigs]);


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

  const handleTasksSort = (sectionKey: string, sortConfig: { field: string; order: 'asc' | 'desc' }) => {
    setSortConfigs(prev => ({
      ...prev,
      [sectionKey]: sortConfig
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
    ...todayTasksWithRecurring
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
    getDateRangeDisplay,
    getTimeRangeDisplay,
    isRecurringInstance,
    getRecurringPatternDisplay,

    // Loading/Error
    isLoading: isAnyLoading,
    error,
  };
}