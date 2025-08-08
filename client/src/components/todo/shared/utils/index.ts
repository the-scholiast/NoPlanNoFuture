// Shared utlity functions for TodoBoard and CompletedTasks components
import { formatDateString, ensureLocalDate } from "@/lib/utils/dateUtils";

export const formatDate = (dateString?: string): string | null => {
  if (!dateString) return null;
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    if (!year || !month || !day) return dateString;

    const date = new Date(year, month - 1, day);
    const currentYear = new Date().getFullYear();

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

export const isRecurringInstance = (task: { id: string; parent_task_id?: string }): boolean => {
  return task.id.includes('_') && !!task.parent_task_id;
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
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
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

// Calculate the date for a recurring task instance (simplified approach -> need to track each specific completion date)
export const calculateInstanceDate = (task: any, instanceIndex: number): string => {
  if (task.last_completed_date) {
    const lastCompleted = new Date(task.last_completed_date);
    const daysBack = instanceIndex;
    const instanceDate = new Date(lastCompleted);
    instanceDate.setDate(lastCompleted.getDate() - daysBack);
    return instanceDate.toISOString().split('T')[0];
  }
  
  const created = new Date(task.created_at);
  created.setDate(created.getDate() + instanceIndex);
  return created.toISOString().split('T')[0];
};

// Create recurring task instances for completed tasks
export const createRecurringTaskInstances = (task: any, completionCount?: number): any[] => {
  const instances: any[] = [];
  const count = completionCount || task.completion_count || 0;

  if (count > 0) {
    for (let i = 0; i < count; i++) {
      const instanceDate = calculateInstanceDate(task, i);
      instances.push({
        ...task,
        id: `${task.id}_instance_${i}`,
        completion_date: instanceDate,
        is_recurring_instance: true,
        original_task: task,
        instance_count: i + 1
      });
    }
  }

  return instances;
};