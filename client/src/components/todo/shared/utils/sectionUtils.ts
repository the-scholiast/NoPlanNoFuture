import { TaskData } from "@/types/todoTypes";

// Combines all task arrays into a single array for operations
export const combineAllTasks = (
  filteredDailyTasks: TaskData[],
  todayTasksWithRecurring: TaskData[],
  upcomingTasks: TaskData[],
  upcomingTasksWithRecurring: TaskData[]
): TaskData[] => {
  return [
    ...filteredDailyTasks,
    ...todayTasksWithRecurring,
    ...upcomingTasks,
    ...upcomingTasksWithRecurring,
  ];
};

export const getSectionLabel = (section: string): string => {
  switch (section) {
    case 'daily': return 'Daily';
    case 'today': return 'Today';
    case 'upcoming': return 'Upcoming';
    case 'none': return 'None';
    default: return 'Other';
  }
};

export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
    case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
    case 'low': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
  }
};

// Add this function after getPriorityColor
export const getSectionColor = (section: string): string => {
  switch (section) {
    case 'daily': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 border-purple-200 dark:border-purple-700';
    case 'today': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-700';
    case 'upcoming': return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 border-orange-200 dark:border-orange-700';
    case 'none': return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    default: return 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  }
};

// Add this function to combine section and priority colors
export const getTaskColors = (section: string, priority?: string): string => {
  // Priority takes precedence but we keep section as base for subtle distinction
  if (priority === 'high') {
    switch (section) {
      case 'daily': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300 dark:border-red-700';
      case 'today': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300 dark:border-red-700';
      case 'upcoming': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300 dark:border-red-700';
      default: return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-300 dark:border-red-700';
    }
  }

  if (priority === 'medium') {
    switch (section) {
      case 'daily': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700';
      case 'today': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700';
      case 'upcoming': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700';
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700';
    }
  }

  // Low priority or no priority - use section colors
  return getSectionColor(section);
};