import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TaskData } from '@/types/todoTypes';
import { useTodoMutations } from '../../shared/hooks';
import { getTodayString } from '@/lib/utils/dateUtils';
import { todoApi } from '@/lib/api/todos';
import { recurringTodoApi } from '@/lib/api/recurringTodosApi';
import { todoKeys } from '@/lib/queryKeys';
import { TodoSection } from '../../shared/types';
import { filterDailyTasksByDate, filterTasksByDateRange, sortTasksTimeFirst, getRecurringDescription } from '../../shared';
import { formatDate, formatTime, getDateRangeDisplay, getTimeRangeDisplay, isRecurringInstance, } from '../../shared';

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
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const {
    data: todayTasksWithRecurring = [],
    isLoading: isLoadingTodayRecurring,
  } = useQuery({
    queryKey: todoKeys.today,
    queryFn: recurringTodoApi.getTodayTasks,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const {
    data: upcomingTasksWithRecurring = [],
    isLoading: isLoadingUpcomingRecurring,
  } = useQuery({
    queryKey: todoKeys.upcoming,
    queryFn: recurringTodoApi.getUpcomingTasks,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const { deleteTaskMutation } = useTodoMutations();

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

  // Filtered daily tasks logic
  const filteredDailyTasks = useMemo(() => {
    const filtered = filterDailyTasksByDate(dailyTasks, currentDate, showAllDailyTasks);
    return sortTasksTimeFirst(filtered);
  }, [dailyTasks, currentDate, currentDayOfWeek, showAllDailyTasks]);

  const filteredUpcomingTasks = useMemo(() => {
    const filtered = filterTasksByDateRange(upcomingTasks, upcomingFilter);
    return sortTasksTimeFirst(filtered);
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

  // Reset sorted tasks when task IDs change - use useRef to prevent infinite loops
  const previousTaskIds = useRef<{ daily: string; today: string; upcoming: string; }>({
    daily: '',
    today: '',
    upcoming: ''
  });

  useEffect(() => {
    const currentDailyIds = filteredDailyTasks.map(t => t.id).sort().join(',');
    const currentTodayIds = todayTasksWithRecurring.filter(task => task.section !== 'daily' && task.section !== 'none').map(t => t.id).sort().join(',');
    const currentUpcomingIds = [
      ...filteredUpcomingTasks.filter(task => task.section !== 'daily'),
      ...filteredUpcomingRecurringTasks
    ].map(t => t.id).sort().join(',');

    // Only update if task IDs actually changed
    if (
      currentDailyIds !== previousTaskIds.current.daily ||
      currentTodayIds !== previousTaskIds.current.today ||
      currentUpcomingIds !== previousTaskIds.current.upcoming
    ) {
      previousTaskIds.current = {
        daily: currentDailyIds,
        today: currentTodayIds,
        upcoming: currentUpcomingIds
      };

      setSortedTasks({ daily: [], today: [], upcoming: [] });
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

  const handleTasksSort = (sectionKey: string, tasks: TaskData[]) => {
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