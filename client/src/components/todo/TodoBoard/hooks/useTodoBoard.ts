import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TaskData } from '@/types/todoTypes';
import { useTodoMutations } from '../../shared/hooks';
import { getTodayString } from '@/lib/utils/dateUtils';
import { todoApi } from '@/lib/api/todos';
import { recurringTodoApi } from '@/lib/api/recurringTodosApi';
import { todoKeys } from '@/lib/queryKeys';
import { TodoSection } from '../../shared/types';
import { filterDailyTasksByDate, sortTasksByDateTimeAndCompletion, filterTasksByDateRange, sortDailyTasksTimeFirst } from '../../shared';
import { formatDate, formatTime, getDateRangeDisplay, getTimeRangeDisplay, isRecurringInstance, } from '../../shared';

// Business logic for the TodoBoard component
export const useTodoBoard = () => {
  const queryClient = useQueryClient();

  // Direct queries
  const {
    data: allTasks = [],
    isLoading,
    error,
    refetch
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
    refetch: refetchTodayRecurring
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
    refetch: refetchUpcomingRecurring
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
  const [sortedTasks, setSortedTasks] = useState<Record<string, TaskData[]>>({
    daily: [],
    today: [],
    upcoming: []
  });
  const [upcomingFilter, setUpcomingFilter] = useState({
    startDate: '',
    endDate: '',
    enabled: true
  });
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
    return sortDailyTasksTimeFirst(filtered);
  }, [dailyTasks, currentDate, currentDayOfWeek, showAllDailyTasks]);

  const filteredUpcomingTasks = useMemo(() => {
    const filtered = filterTasksByDateRange(upcomingTasks, upcomingFilter);
    return sortTasksByDateTimeAndCompletion(filtered);
  }, [upcomingTasks, upcomingFilter]);

  const filteredUpcomingRecurringTasks = useMemo(() => {
    const tasks = upcomingTasksWithRecurring.filter(task => task.section !== 'daily');
    const filtered = filterTasksByDateRange(tasks, upcomingFilter);
    return sortTasksByDateTimeAndCompletion(filtered);
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
      tasks: sortedTasks.today.length > 0 ? sortedTasks.today : sortTasksByDateTimeAndCompletion(
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

  // Reset sorted tasks when task IDs change
  useEffect(() => {
    const currentDailyIds = filteredDailyTasks.map(t => t.id).sort().join(',');
    const currentTodayIds = todayTasksWithRecurring.filter(task => task.section !== 'daily' && task.section !== 'none').map(t => t.id).sort().join(',');
    const currentUpcomingIds = [
      ...filteredUpcomingTasks.filter(task => task.section !== 'daily'),
      ...filteredUpcomingRecurringTasks
    ].map(t => t.id).sort().join(',');

    setSortedTasks(prev => {
      const prevDailyIds = prev.daily.map(t => t.id).sort().join(',');
      const prevTodayIds = prev.today.map(t => t.id).sort().join(',');
      const prevUpcomingIds = prev.upcoming.map(t => t.id).sort().join(',');

      if (currentDailyIds !== prevDailyIds || currentTodayIds !== prevTodayIds || currentUpcomingIds !== prevUpcomingIds) {
        return {
          daily: [],
          today: [],
          upcoming: []
        };
      }

      const updateTasksArray = (sortedArray: TaskData[], freshTasks: TaskData[]) => {
        if (sortedArray.length === 0) return [];
        const freshTaskMap = new Map(freshTasks.map(task => [task.id, task]));
        return sortedArray
          .map(sortedTask => freshTaskMap.get(sortedTask.id) || sortedTask)
          .filter(task => freshTaskMap.has(task.id));
      };

      if (prev.daily.length > 0 || prev.today.length > 0 || prev.upcoming.length > 0) {
        return {
          daily: updateTasksArray(prev.daily, filteredDailyTasks),
          today: updateTasksArray(prev.today, todayTasksWithRecurring.filter(task => task.section !== 'daily' && task.section !== 'none')),
          upcoming: updateTasksArray(prev.upcoming, [
            ...filteredUpcomingTasks.filter(task => task.section !== 'daily'),
            ...filteredUpcomingRecurringTasks
          ])
        };
      }

      return prev;
    });
  }, [filteredDailyTasks, todayTasksWithRecurring, filteredUpcomingTasks, filteredUpcomingRecurringTasks]);

  const getRecurringPatternDisplay = (task: TaskData) => {
    return recurringTodoApi.getRecurringDescription(task);
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

  // Invalidate cache functions for mutations
  const invalidateTimetableCache = () => {
    queryClient.invalidateQueries({ queryKey: todoKeys.timetable.tasks });
    queryClient.invalidateQueries({ queryKey: todoKeys.timetable.allWeeks });
  };

  const refetchTimetable = (weekStartDate?: string) => {
    if (weekStartDate) {
      queryClient.invalidateQueries({ queryKey: todoKeys.timetable.week(weekStartDate) });
    } else {
      invalidateTimetableCache();
    }
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
    filteredDailyTasks,
    todayTasksWithRecurring,
    upcomingTasksWithRecurring,
    filteredUpcomingTasks,
    filteredUpcomingRecurringTasks,
    getAllCurrentTasks,

    // State
    expandedTask,
    setExpandedTask,
    editModalOpen,
    setEditModalOpen,
    taskToEdit,
    setTaskToEdit,
    upcomingFilter,
    setUpcomingFilter,
    showAllDailyTasks,

    // Actions
    openEditModal,
    handleTasksSort,
    deleteTask,
    toggleTaskExpansion,
    toggleShowAllDailyTasks,
    refetch,
    refetchTodayRecurring,
    refetchUpcomingRecurring,
    invalidateTimetableCache,
    refetchTimetable,

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