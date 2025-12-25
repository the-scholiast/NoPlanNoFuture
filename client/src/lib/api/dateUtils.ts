/**
 * Date utility functions for API routes
 */

// Convert Date object to YYYY-MM-DD string
export const formatDateString = (date: Date): string => {
  if (!(date instanceof Date)) {
    throw new Error('formatDateString expects a Date object');
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Parse YYYY-MM-DD string to Date object in local timezone
export const parseToLocalDate = (dateString: string): Date => {
  if (typeof dateString !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    throw new Error('parseToLocalDate expects a YYYY-MM-DD string');
  }
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
};

// Convert Date or string to Date object, ensuring local timezone
export const ensureLocalDate = (dateInput: Date | string): Date => {
  if (dateInput instanceof Date) {
    return dateInput;
  }
  return parseToLocalDate(dateInput);
};

const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// Get the day name from a date
export const getDayName = (date: Date): string => {
  const dayIndex = ensureLocalDate(date as any).getDay();
  return DAYS_OF_WEEK[dayIndex];
};

// Check if a task should appear on a specific date
export const shouldTaskAppearOnDate = (task: any, date: Date): boolean => {
  if (!task.is_recurring || !task.recurring_days || task.recurring_days.length === 0) {
    return false;
  }

  // Check date range
  if (task.start_date && formatDateString(date) < task.start_date) return false;
  if (task.end_date && formatDateString(date) > task.end_date) return false;

  // Check if day is included
  const dayName = getDayName(date);
  return task.recurring_days.includes(dayName);
};

