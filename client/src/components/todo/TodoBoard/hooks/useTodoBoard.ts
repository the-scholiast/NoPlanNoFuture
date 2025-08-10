import { useState, useMemo, useEffect, useCallback } from 'react';
import { TaskData } from '@/types/todoTypes';
import { useTodo } from '@/contexts/TodoContext';
import { useTodoMutations } from '../../shared/hooks';
import { getTodayString, parseToLocalDate } from '@/lib/utils/dateUtils';
import { recurringTodoApi } from '@/lib/api/recurringTodosApi';
import { TodoSection } from '../../shared/types';
import { shouldTaskAppearOnDate } from '@/lib/utils/recurringDatesUtils';
import {
  formatDate,
  formatTime,
  getDateRangeDisplay,
  getTimeRangeDisplay,
  isRecurringInstance,
  combineAllTasks,
} from '../../shared';

// Business logic for the TodoBoard component
export const useTodoBoard = () => {
  const {
    dailyTasks,                    // Recurring daily tasks from your database
    todayTasksWithRecurring,       // Today's tasks + recurring instances (from server-side generation)
    upcomingTasksWithRecurring,    // Future recurring task instances (from server-side generation)
    upcomingTasks,                 // Regular upcoming tasks
    isLoading,                     // Main tasks loading state
    isLoadingTodayRecurring,       // Today's recurring tasks loading state
    isLoadingUpcomingRecurring,    // Upcoming recurring tasks loading state
    error,                         // Any query errors
  } = useTodo();

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
    return dailyTasks.filter(task => {
      // If showing all tasks, skip day-specific filtering
      if (showAllDailyTasks) {
        // Still apply date range filtering
        if (!task.start_date && !task.end_date) return true;
        if (task.start_date && !task.end_date) return task.start_date >= currentDate;
        if (!task.start_date && task.end_date) return currentDate <= task.end_date;
        if (task.start_date && task.end_date) {
          return currentDate >= task.start_date && currentDate <= task.end_date;
        }
        return true;
      }

      // For recurring tasks, check if they should appear today
      if (task.is_recurring && task.recurring_days && task.recurring_days.length > 0) {
        // First check if task should appear based on recurring schedule
        const today = new Date();
        if (!shouldTaskAppearOnDate(task, today)) {
          return false;
        }
      }

      // Apply existing date range filtering
      if (!task.start_date && !task.end_date) return true;
      if (task.start_date && !task.end_date) return task.start_date >= currentDate;
      if (!task.start_date && task.end_date) return currentDate <= task.end_date;
      if (task.start_date && task.end_date) {
        return currentDate >= task.start_date && currentDate <= task.end_date;
      }
      return true;
    });
  }, [dailyTasks, currentDate, currentDayOfWeek, showAllDailyTasks]);

  const filteredUpcomingTasks = useMemo(() => {
    let tasks = upcomingTasks;
    if (upcomingFilter.enabled) {
      tasks = upcomingTasks.filter(task => {
        const taskDate = task.start_date || task.created_at?.split('T')[0];
        if (!taskDate) return false;
        const taskDateStr = taskDate.includes('T') ? taskDate.split('T')[0] : taskDate;

        const taskDateObj = parseToLocalDate(taskDateStr);
        const startDateObj = parseToLocalDate(upcomingFilter.startDate);
        const endDateObj = parseToLocalDate(upcomingFilter.endDate);

        // Compare using Date objects instead of strings to avoid timezone issues
        return taskDateObj >= startDateObj && taskDateObj <= endDateObj;
      });
    }

    return tasks.sort((a, b) => {
      const dateA = a.start_date || a.created_at?.split('T')[0] || '';
      const dateB = b.start_date || b.created_at?.split('T')[0] || '';

      const dateObjA = dateA ? parseToLocalDate(dateA.split('T')[0]) : new Date(0);
      const dateObjB = dateB ? parseToLocalDate(dateB.split('T')[0]) : new Date(0);

      if (dateObjA.getTime() !== dateObjB.getTime()) {
        return dateObjA.getTime() - dateObjB.getTime();
      }

      const timeA = a.start_time || '';
      const timeB = b.start_time || '';

      if (timeA && timeB) {
        return timeA.localeCompare(timeB);
      }

      if (timeA && !timeB) return -1;
      if (!timeA && timeB) return 1;

      return a.title.localeCompare(b.title);
    });
  }, [upcomingTasks, upcomingFilter]);

  // Filtered upcoming tasks with date filtering
  const filteredUpcomingRecurringTasks = useMemo(() => {
    let tasks = upcomingTasksWithRecurring.filter(task => task.section !== 'daily');

    if (upcomingFilter.enabled) {
      tasks = tasks.filter(task => {
        const taskDate = task.start_date || task.created_at?.split('T')[0];
        if (!taskDate) return false;

        const taskDateStr = taskDate.includes('T') ? taskDate.split('T')[0] : taskDate;

        const taskDateObj = parseToLocalDate(taskDateStr);
        const startDateObj = parseToLocalDate(upcomingFilter.startDate);
        const endDateObj = parseToLocalDate(upcomingFilter.endDate);

        // Compare using Date objects instead of strings to avoid timezone issues
        return taskDateObj >= startDateObj && taskDateObj <= endDateObj;
      });
    }

    return tasks.sort((a, b) => {
      const dateA = a.start_date || a.created_at?.split('T')[0] || '';
      const dateB = b.start_date || b.created_at?.split('T')[0] || '';

      // Parse dates consistently using local timezone
      const dateObjA = dateA ? parseToLocalDate(dateA.split('T')[0]) : new Date(0);
      const dateObjB = dateB ? parseToLocalDate(dateB.split('T')[0]) : new Date(0);

      // First, sort by date using Date objects
      if (dateObjA.getTime() !== dateObjB.getTime()) {
        return dateObjA.getTime() - dateObjB.getTime();
      }

      // If dates are the same, sort by start time
      const timeA = a.start_time || '';
      const timeB = b.start_time || '';

      if (timeA && timeB) {
        return timeA.localeCompare(timeB);
      }

      // If only one has time, put the one with time first
      if (timeA && !timeB) return -1;
      if (!timeA && timeB) return 1;

      // If neither has time, maintain original order (or sort by title)
      return a.title.localeCompare(b.title);
    });
  }, [upcomingTasksWithRecurring, upcomingFilter]);

  // Sync sorted tasks
  useEffect(() => {
    setSortedTasks(prev => ({
      ...prev,
      daily: filteredDailyTasks,
      today: todayTasksWithRecurring.filter(task => task.section !== 'daily'),
      upcoming: [
        ...filteredUpcomingTasks.filter(task => task.section !== 'daily'),
        ...filteredUpcomingRecurringTasks
      ]
    }));
  }, [filteredDailyTasks, todayTasksWithRecurring, filteredUpcomingTasks, filteredUpcomingRecurringTasks]);


  // Sections configuration
  const sections: TodoSection[] = [
    {
      title: "Daily Tasks",
      sectionKey: 'daily',
      tasks: sortedTasks.daily,
    },
    {
      title: "Today",
      sectionKey: 'today',
      tasks: sortedTasks.today,
    },
    {
      title: "Upcoming",
      sectionKey: 'upcoming',
      tasks: sortedTasks.upcoming,
    }
  ];

  const getRecurringPatternDisplay = (task: TaskData) => {
    return recurringTodoApi.getRecurringDescription(task);
  };

  const deleteTask = (taskId: string) => {
    deleteTaskMutation.mutate(taskId);
  };

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTask(expandedTask === taskId ? null : taskId);
  };

  // Ensures editing a recurring instance modifies the original task > Remove? Instance tasks should appear in completed component?
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
    sortedTasks,
    setSortedTasks,
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