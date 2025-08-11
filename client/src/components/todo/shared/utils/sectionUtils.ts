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