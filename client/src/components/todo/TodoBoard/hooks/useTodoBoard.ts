import { useState, useMemo, useEffect, useRef } from 'react';
import { TaskData } from '@/types/todoTypes';
import { useTodo } from '@/contexts/TodoContext';
import { useTodoMutations } from '../../shared/hooks';
import { getTodayString } from '@/lib/utils/dateUtils';
import { recurringTodoApi } from '@/lib/api/recurringTodosApi';
import { TodoSection } from '../../shared/types';
import { filterDailyTasksByDate, sortTasksByDateTimeAndCompletion, filterTasksByDateRange, sortDailyTasksTimeFirst } from '../../shared';
import {
  formatDate,
  formatTime,
  getDateRangeDisplay,
  getTimeRangeDisplay,
  isRecurringInstance,
} from '../../shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { todoApi } from '@/lib/api/todos';

// Business logic for the TodoBoard component
export const useTodoBoard = () => {
  const {
    dailyTasks,                    // Recurring daily tasks from your database
    upcomingTasks,                 // Regular upcoming tasks
    error,                         // Any query errors
  } = useTodo();
  const queryClient = useQueryClient();
  const { data: allTasks = [], isLoading } = useQuery({
    queryKey: ['todos'],
    queryFn: todoApi.getAll,
    staleTime: 1000,
  });

  const { data: todayTasksWithRecurring = [], isLoading: isLoadingTodayRecurring } = useQuery({
    queryKey: ['recurring-todos', 'today'],
    queryFn: recurringTodoApi.getTodayTasks,
    staleTime: 0,
  });

  const { data: upcomingTasksWithRecurring = [], isLoading: isLoadingUpcomingRecurring } = useQuery({
    queryKey: ['recurring-todos', 'upcoming'],
    queryFn: recurringTodoApi.getUpcomingTasks,
    staleTime: 1000 * 60 * 5,
  });
  const { deleteTaskMutation, } = useTodoMutations();
  // UI interaction states
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskData | null>(null);
  // Task sorting state when user manually sorts tasks
  const [sortedTasks, setSortedTasks] = useState<{ [key: string]: TaskData[] }>({
    daily: [],
    today: [],
    upcoming: []
  });
  // Task filtering states
  const [upcomingFilter, setUpcomingFilter] = useState({
    startDate: '',
    endDate: '',
    enabled: true
  });
  // Toggle for daily tasks filtering
  const [showAllDailyTasks, setShowAllDailyTasks] = useState(false);

  // Get current date for filtering
  const currentDate: string = useMemo(() => {
    return getTodayString();
  }, []);

  // Get current day of week for recurring task filtering
  const currentDayOfWeek = useMemo(() => {
    const today = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return dayNames[today.getDay()];
  }, []);

  // Filtered daily tasks logic
  const filteredDailyTasks = useMemo(() => {
    const filtered = filterDailyTasksByDate(dailyTasks, currentDate, showAllDailyTasks);
    return sortDailyTasksTimeFirst(filtered); // Apply consistent start_time asc sorting
  }, [dailyTasks, currentDate, currentDayOfWeek, showAllDailyTasks]);

  const filteredUpcomingTasks = useMemo(() => {
    const filtered = filterTasksByDateRange(upcomingTasks, upcomingFilter);
    return sortTasksByDateTimeAndCompletion(filtered);
  }, [upcomingTasks, upcomingFilter]);

  // Filtered upcoming tasks with date filtering
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
      tasks: filteredDailyTasks, // Direct from React Query
    },
    {
      title: "Today",
      sectionKey: 'today',
      tasks: sortTasksByDateTimeAndCompletion(
        todayTasksWithRecurring.filter(task => task.section !== 'daily')
      ), // Direct from React Query
    },
    {
      title: "Upcoming",
      sectionKey: 'upcoming',
      tasks: [
        ...filteredUpcomingTasks.filter(task => task.section !== 'daily'),
        ...filteredUpcomingRecurringTasks
      ], // Direct from React Query
    }
  ], [filteredDailyTasks, todayTasksWithRecurring, filteredUpcomingTasks, filteredUpcomingRecurringTasks]);

  const getRecurringPatternDisplay = (task: TaskData) => {
    return recurringTodoApi.getRecurringDescription(task);
  };

  const deleteTask = (taskId: string) => {
    deleteTaskMutation.mutate(taskId);
  };

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTask(expandedTask === taskId ? null : taskId);
  };

  // Ensures editing a recurring instance modifies the original task
  const openEditModal = (task: TaskData) => {
    // Handle recurring task instances
    if (task.id.includes('_') && task.parent_task_id) {
      // Create edit task with original ID for proper database updates
      const editTask = {
        ...task,
        id: task.parent_task_id || task.id.split('_')[0]
      };
      setTaskToEdit(editTask);
    } else {
      // Regular task - edit as-is
      setTaskToEdit(task);
    }
    setEditModalOpen(true);
  };

  // Allows users to manually reorder tasks within sections. Updates local state to override default ordering
  const handleTasksSort = (sectionKey: string, tasks: TaskData[]) => {
    setSortedTasks(prev => ({
      ...prev,
      [sectionKey]: tasks
    }));
  };

  // Loading state
  const isAnyLoading = isLoading || isLoadingTodayRecurring || isLoadingUpcomingRecurring;

  // Toggle function for daily tasks filter
  const toggleShowAllDailyTasks = () => {
    setShowAllDailyTasks(prev => !prev);
  };

  return {
    // Data
    sections,
    filteredDailyTasks,
    todayTasksWithRecurring,
    upcomingTasksWithRecurring,
    filteredUpcomingTasks,
    filteredUpcomingRecurringTasks,

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