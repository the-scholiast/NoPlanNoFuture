import { useState, useMemo, useEffect } from 'react';
import { TaskData } from '@/types/todoTypes';
import { useTodo } from '@/contexts/TodoContext';
import { useTodoMutations } from '../../shared/hooks';
import { getTodayString } from '@/lib/utils/dateUtils';
import { recurringTodoApi } from '@/lib/api/recurringTodosApi';
import { TodoSection } from '../../shared/types';

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

  const {
    createTaskMutation,
    toggleTaskFunction,
    clearCompletedMutation,
    clearAllMutation,
    deleteTaskMutation,
  } = useTodoMutations();

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

  // Get current date for filtering
  const currentDate: string = useMemo(() => {
    return getTodayString();
  }, []);

  // Filtered daily tasks logic
  const filteredDailyTasks = useMemo(() => {
    return dailyTasks.filter(task => {
      // Infinitely recurring tasks (no date constraints)
      if (!task.start_date && !task.end_date) return true;
      // Tasks with start date but no end date (future tasks only)
      if (task.start_date && !task.end_date) return task.start_date >= currentDate;
      // Tasks with end date but no start date (until expiry)
      if (!task.start_date && task.end_date) return currentDate <= task.end_date;
      // Tasks with both dates (within range)
      if (task.start_date && task.end_date) {
        return currentDate >= task.start_date && currentDate <= task.end_date;
      }
      return true;
    });
  }, [dailyTasks, currentDate]);

  // Filtered upcoming tasks with date filtering
  const filteredUpcomingRecurringTasks = useMemo(() => {
    let tasks = upcomingTasksWithRecurring.filter(task => task.section !== 'daily');

    if (upcomingFilter.enabled) {
      tasks = tasks.filter(task => {
        const taskDate = task.start_date || task.created_at?.split('T')[0];
        if (!taskDate) return false;
        const taskDateStr = taskDate.includes('T') ? taskDate.split('T')[0] : taskDate;
        return taskDateStr >= upcomingFilter.startDate && taskDateStr <= upcomingFilter.endDate;
      });
    }

    // Sort tasks by date first, then by time if available
    return tasks.sort((a, b) => {
      const dateA = a.start_date || a.created_at?.split('T')[0] || '';
      const dateB = b.start_date || b.created_at?.split('T')[0] || '';
      // First, sort by date
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      // If dates are the same, sort by start time
      const timeA = a.start_time || '';
      const timeB = b.start_time || '';
      if (timeA && timeB) return timeA.localeCompare(timeB);
      // If only one has time, put the one with time first
      if (timeA && !timeB) return -1;
      if (!timeA && timeB) return 1;
      // If neither has time, maintain original order (or sort by title)
      return a.title.localeCompare(b.title);
    });
  }, [upcomingTasksWithRecurring, upcomingFilter]);

  const filteredUpcomingTasks = useMemo(() => {
    let tasks = upcomingTasks;
    if (upcomingFilter.enabled) {
      tasks = upcomingTasks.filter(task => {
        const taskDate = task.start_date || task.created_at?.split('T')[0];
        if (!taskDate) return false;
        const taskDateStr = taskDate.includes('T') ? taskDate.split('T')[0] : taskDate;
        return taskDateStr >= upcomingFilter.startDate && taskDateStr <= upcomingFilter.endDate;
      });
    }

    return tasks.sort((a, b) => {
      const dateA = a.start_date || a.created_at?.split('T')[0] || '';
      const dateB = b.start_date || b.created_at?.split('T')[0] || '';
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      const timeA = a.start_time || '';
      const timeB = b.start_time || '';
      if (timeA && timeB) return timeA.localeCompare(timeB);
      if (timeA && !timeB) return -1;
      if (!timeA && timeB) return 1;
      return a.title.localeCompare(b.title);
    });
  }, [upcomingTasks, upcomingFilter]);

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

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      const [year, month, day] = dateString.split('-').map(Number);
      if (!year || !month || !day) return dateString;
      const date = new Date(year, month - 1, day);
      const currentYear = new Date().getFullYear();
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== currentYear ? 'numeric' : undefined
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return null;
    try {
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeString;
    }
  };

  const getDateRangeDisplay = (task: TaskData) => {
    const startDate = formatDate(task.start_date);
    const endDate = formatDate(task.end_date);
    if (!startDate && !endDate) return null;
    if (startDate && endDate && startDate !== endDate) {
      return `${startDate} - ${endDate}`;
    }
    return startDate || endDate;
  };

  const getTimeRangeDisplay = (task: TaskData) => {
    const startTime = formatTime(task.start_time);
    const endTime = formatTime(task.end_time);
    if (!startTime && !endTime) return null;
    if (startTime && endTime) {
      return `${startTime} - ${endTime}`;
    }
    return startTime || endTime;
  };

  const isRecurringInstance = (task: TaskData) => {
    return task.id.includes('_') && task.parent_task_id;
  };

  const getRecurringPatternDisplay = (task: TaskData) => {
    return recurringTodoApi.getRecurringDescription(task);
  };

  // Updated toggle task function to handle recurring task instances
  const toggleTask = (taskId: string) => {
    // Include upcomingTasksWithRecurring in the search
    const allTasks = [
      ...filteredDailyTasks, // Use filtered daily tasks
      ...todayTasksWithRecurring,
      ...upcomingTasks,
      ...upcomingTasksWithRecurring
    ];

    // Create a proper boolean function for isRecurringInstance
    const isRecurringInstanceBoolean = (task: TaskData): boolean => {
      return Boolean(task.id.includes('_') && task.parent_task_id);
    };

    toggleTaskFunction(taskId, allTasks, isRecurringInstanceBoolean);
  };

  const clearCompleted = (sectionIndex: number) => {
    const section = sections[sectionIndex];
    clearCompletedMutation.mutate(section.sectionKey);
  };

  const clearAll = (sectionIndex: number) => {
    const section = sections[sectionIndex];
    clearAllMutation.mutate(section.sectionKey);
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

    // Actions
    toggleTask,
    openEditModal,
    handleTasksSort,
    clearCompleted,
    clearAll,
    deleteTask,
    toggleTaskExpansion,

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