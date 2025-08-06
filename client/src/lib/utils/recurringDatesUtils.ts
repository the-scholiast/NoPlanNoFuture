import { TaskData } from "@/types/todoTypes";
import { DAYS_OF_WEEK } from "./constants";
import { formatDateString, } from "./dateUtils";

// Check if task should appear on a specific date
export const shouldTaskAppearOnDate = (task: TaskData, date: Date): boolean => {
  if (!task.is_recurring || !task.recurring_days || task.recurring_days.length === 0) {
    return false;
  }

  const targetDate : string = formatDateString(date)

  // Check if date is within the task's date range
  if (task.start_date) {
    if (targetDate < task.start_date) return false;
  }

  if (task.end_date) {
    if (targetDate > task.end_date) return false;
  }

  // Get day of week for the given date
  const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const dayName = DAYS_OF_WEEK[dayIndex];

  // Check if this day is included in the recurring_days
  return task.recurring_days.includes(dayName);
};

// Obtain an array of the separate days the Task should reoccur given the date range provided
export const generateRecurringTaskInstances = (
  task: TaskData,
  startDate: Date,
  endDate: Date
): Array<{ date: string; task: TaskData }> => {
  if (!task.is_recurring || !task.recurring_days) {
    return [];
  }

  const instances: Array<{ date: string; task: TaskData }> = [];
  const currentDate = new Date(startDate);

  // Push all dates the task should reoccur to the array 
  while (currentDate <= endDate) {
    if (shouldTaskAppearOnDate(task, currentDate)) {
      const formattedCurrentDate = formatDateString(currentDate);
      instances.push({
        date: formattedCurrentDate, // The exact date the task should occur
        task: {
          ...task,
          id: `${task.id}_${formattedCurrentDate}`, // Unique ID for each instance
        }
      });
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return instances;
};