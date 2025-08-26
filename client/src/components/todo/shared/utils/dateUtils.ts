import { formatDateString } from "@/lib/utils/dateUtils";
import { TaskData } from "@/types/todoTypes";

// Convert YYYY-MM-DD date string to localized format
export const formatDate = (dateString?: string): string | null => {
  if (!dateString) return null;
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    if (!year || !month || !day) return dateString;

    const date = new Date(year, month - 1, day);

    return formatDateString(date);
  } catch {
    return dateString;
  }
};

// Convert HH:MM time string to 12-hour format with AM/PM
export const formatTime = (timeString?: string): string | null => {
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

// Get the Monday date of the current week in YYYY-MM-DD format
export const getCurrentWeekStart = (): string => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysFromMonday);
  return formatDateString(monday);
};

// Get the Sunday date of the current week in YYYY-MM-DD format
export const getCurrentWeekEnd = (): string => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const sunday = new Date(now);
  sunday.setDate(now.getDate() + (6 - daysFromMonday));
  return formatDateString(sunday);
};

// Get the date 7 days ago from yesterday in YYYY-MM-DD format
export const getLast7DaysStart = (): string => {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7)
  return formatDateString(sevenDaysAgo);
}

// Get yesterday's date in YYYY-MM-DD format (for last 7 days end range)
export const getLast7DaysEnd = (): string => {
  const now = new Date();
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  return formatDateString(yesterday);
}

// Format task date range as "Start - End" or single dates
export const getDateRangeDisplay = (task: TaskData): string | null => {
  const startDate = formatDate(task.start_date);
  const endDate = formatDate(task.end_date);

  if (!startDate && !endDate) return null;

  if (startDate && endDate && startDate !== endDate) {
    return `${startDate} - ${endDate}`;
  }

  return startDate || endDate;
};

// Format task time range as "Start - End" or single time
export const getTimeRangeDisplay = (task: TaskData): string | null => {
  const startTime = formatTime(task.start_time);
  const endTime = formatTime(task.end_time);

  if (!startTime && !endTime) return null;

  if (startTime && endTime) {
    return `${startTime} - ${endTime}`;
  }

  return startTime || endTime;
};

// Fix timezone issue: avoid using new Date() constructor with date strings for display
export const formatLocalDate = (dateStr: string): string => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString();
};

export const getMonthStartAndEndDate = (): { startDate: string; endDate: string } => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const startDate = formatDateString(firstDay);
  const endDate = formatDateString(lastDay);

  return { startDate, endDate }
}