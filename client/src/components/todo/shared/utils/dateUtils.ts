import { formatDateString, ensureLocalDate } from "@/lib/utils/dateUtils";
import { TaskData } from "@/types/todoTypes";

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

export const getCurrentWeekStart = (): string => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysFromMonday);
  return formatDateString(monday);
};

export const getCurrentWeekEnd = (): string => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const sunday = new Date(now);
  sunday.setDate(now.getDate() + (6 - daysFromMonday));
  return formatDateString(sunday);
};

// Format completion timestamp for display
export const formatCompletionTimestamp = (timestamp: string): string => {
  try {
    // Simply extract the date part from ISO timestamp
    return timestamp.split('T')[0];
  } catch {
    return timestamp;
  }
};

// Get relative data description (e.g., "Today", "Yesterday", "2 days ago")
export const getRelativeDateDescription = (dateString: string): string => {
  try {
    const date: Date = ensureLocalDate(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    // Reset time to compare just dates
    date.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    yesterday.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) {
      return 'Today';
    } else if (date.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      const diffTime = today.getTime() - date.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays > 0) {
        return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
      } else {
        return `In ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`;
      }
    }
  } catch {
    return dateString;
  }
};

// Formats date range display for a task
export const getDateRangeDisplay = (task: TaskData): string | null => {
  const startDate = formatDate(task.start_date);
  const endDate = formatDate(task.end_date);

  if (!startDate && !endDate) return null;

  if (startDate && endDate && startDate !== endDate) {
    return `${startDate} - ${endDate}`;
  }

  return startDate || endDate;
};

// Formats time range display for a task
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
export const formatLocalDate = (dateStr: string) : string => {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString();
};