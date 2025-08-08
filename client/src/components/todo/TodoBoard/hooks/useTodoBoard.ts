import { useState, useMemo } from 'react';
import { TaskData } from '@/types/todoTypes';
import { useTodo } from '@/contexts/TodoContext';
import { useTodoMutations } from '../../shared/hooks';
import { getTodayString } from '@/lib/utils/dateUtils';

// Defines the structure for each section in TodoBoard
interface TodoSection {
  title: string;
  sectionKey: 'daily' | 'today' | 'upcoming';
  tasks: TaskData[];
  showAddButton: boolean;
}

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

  const { toggleTaskMutation } = useTodoMutations();

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

  // Sections configuration
  const sections: TodoSection[] = useMemo(() => [
    {
      title: "Daily Tasks",
      sectionKey: 'daily',
      tasks: sortedTasks.daily.length > 0 ? sortedTasks.daily : filteredDailyTasks,
      showAddButton: true
    },
    {
      title: "Today",
      sectionKey: 'today',
      tasks: sortedTasks.today.length > 0 ? sortedTasks.today : todayTasksWithRecurring,
      showAddButton: true
    },
    {
      title: "Upcoming",
      sectionKey: 'upcoming',
      tasks: sortedTasks.upcoming.length > 0 ? sortedTasks.upcoming : [...upcomingTasks, ...upcomingTasksWithRecurring],
      showAddButton: true
    }
  ], [filteredDailyTasks, todayTasksWithRecurring, upcomingTasks, upcomingTasksWithRecurring, sortedTasks]);

  // Handles task completion logic
  const toggleTask = (taskId: string) => {
    // Search all possible task sources
    const allTasks = [
      ...filteredDailyTasks,        // Filtered daily recurring tasks
      ...todayTasksWithRecurring,   // Today's tasks + recurring instances
      ...upcomingTasks,             // Regular upcoming tasks
      ...upcomingTasksWithRecurring // Future recurring instances
    ];

    // Find the specific task to toggle
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;

    // Use shared mutation (handles recurring task ID extraction automatically) -> Remove? Instance tasks should appear in completed component?
    toggleTaskMutation.mutate({
      taskId,
      completed: !task.completed
    });
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
    
    // State
    expandedTask,
    setExpandedTask,
    editModalOpen,
    setEditModalOpen,
    taskToEdit,
    setTaskToEdit,
    
    // Actions
    toggleTask,
    openEditModal,
    handleTasksSort,
    
    // Loading/Error
    isLoading: isAnyLoading,
    error,
  };
}