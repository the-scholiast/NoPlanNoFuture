import { parseToLocalDate } from "@/lib/utils/dateUtils";
import { shouldTaskAppearOnDate } from "@/lib/utils/recurringDatesUtils";
import { TaskData } from "@/types/todoTypes";
import { DateRangeFilter } from "../types";

export const filterDailyTasksByDate = (
  tasks: TaskData[], 
  currentDate: string, 
  showAllDailyTasks: boolean
) => {
  return tasks.filter(task => {
    if (showAllDailyTasks) {
      // Apply date range filtering only
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
};

export const filterUpcomingTasksByDateRange = (
  tasks: TaskData[], 
  upcomingFilter: { startDate: string; endDate: string; enabled: boolean }
) => {
  if (!upcomingFilter.enabled) return tasks;
  
  return tasks.filter(task => {
    const taskDate = task.start_date || task.created_at?.split('T')[0];
    if (!taskDate) return false;

    const taskDateStr = taskDate.includes('T') ? taskDate.split('T')[0] : taskDate;
    const taskDateObj = parseToLocalDate(taskDateStr);
    const startDateObj = parseToLocalDate(upcomingFilter.startDate);
    const endDateObj = parseToLocalDate(upcomingFilter.endDate);

    return taskDateObj >= startDateObj && taskDateObj <= endDateObj;
  });
};

// Filter tasks by date range if the filter is enabled
export const filterTasksByDateRange = (tasks: TaskData[], filter: DateRangeFilter): TaskData[] => {
  if (!filter.enabled) {
    return tasks;
  }

  return tasks.filter(task => {
    const taskDate = task.start_date || task.created_at?.split('T')[0];
    if (!taskDate) return false;

    const taskDateStr = taskDate.includes('T') ? taskDate.split('T')[0] : taskDate;

    const taskDateObj = parseToLocalDate(taskDateStr);
    const startDateObj = parseToLocalDate(filter.startDate);
    const endDateObj = parseToLocalDate(filter.endDate);

    // Compare using Date objects instead of strings to avoid timezone issues
    return taskDateObj >= startDateObj && taskDateObj <= endDateObj;
  });
};

export const applySearchFilter = <T extends { title: string; description?: string }>(
  tasks: T[],
  searchQuery: string
): T[] => {
  if (!searchQuery.trim()) return tasks;
  
  const query = searchQuery.toLowerCase();
  return tasks.filter(task =>
    task.title.toLowerCase().includes(query) ||
    task.description?.toLowerCase().includes(query)
  );
};

export const applyDateFilter = <T extends Record<string, any>>(
  tasks: T[],
  dateFilter: DateRangeFilter,
  getDateField: (task: T) => string | null | undefined
): T[] => {
  if (!dateFilter.enabled || tasks.length === 0) return tasks;

  return tasks.filter(task => {
    const dateValue = getDateField(task);
    if (!dateValue) return false;

    const dateStr = dateValue.includes('T') ? dateValue.split('T')[0] : dateValue;
    return dateStr >= dateFilter.startDate && dateStr <= dateFilter.endDate;
  });
};