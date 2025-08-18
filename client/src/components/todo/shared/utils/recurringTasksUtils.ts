import { formatDateString, getTodayString } from "@/lib/utils/dateUtils";
import { TaskData } from "@/types/todoTypes";
import { TaskFormData } from "..";
import { DAYS_OF_WEEK } from "@/lib/utils/constants";

// Identify recurring task instances. Used by TodoBoard/EditTaskModal to distinguish instances from originals
export const isRecurringInstance = (task: { id: string; parent_task_id?: string }): boolean => {
  return task.id.includes('_') && !!task.parent_task_id;
};

// Extract original task ID from completion or instance ID
export const getOriginalTaskId = (id: string): string => {
  if (id.includes('_instance_')) {
    return id.split('_instance_')[0];
  }
  if (id.includes('_')) {
    return id.split('_')[0];
  }
  return id;
};

// Generate recurring pattern descriptions for UI display
export const getRecurringDescription = (task: TaskData | TaskFormData): string => {
  if (!task.is_recurring || !task.recurring_days || task.recurring_days.length === 0) {
    return task.hasOwnProperty('id') ? 'Not recurring' : ''; // Different default for API vs form
  }

  const days = task.recurring_days;
  const dayNames = days.map(day => day.charAt(0).toUpperCase() + day.slice(1));

  if (days.length === 7) return 'Every day';
  if (days.length === 5 && !days.includes('saturday') && !days.includes('sunday')) return 'Weekdays only';
  if (days.length === 2 && days.includes('saturday') && days.includes('sunday')) return 'Weekends only';
  if (days.length <= 3) return dayNames.join(', ');

  return `${days.length} days per week`;
};

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