import { formatDateString, getTodayString } from "@/lib/utils/dateUtils";
import { TaskData } from "@/types/todoTypes";
import { TaskFormData } from "..";

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

// Calculate the date for a recurring task instance (simplified approach -> need to track each specific completion date)
export const calculateInstanceDate = (task: any, instanceIndex: number): string => {
  if (task.last_completed_date) {
    const lastCompleted = new Date(task.last_completed_date);
    const daysBack = instanceIndex;
    const instanceDate = new Date(lastCompleted);
    instanceDate.setDate(lastCompleted.getDate() - daysBack);
    return formatDateString(instanceDate);
  }

  const created = new Date(task.created_at);
  created.setDate(created.getDate() + instanceIndex);
  return formatDateString(created);
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

/**
 * Check if daily tasks need to be reset based on last app open
 * Uses sessionStorage instead of localStorage for better cleanup
 */
export const shouldResetDailyTasks = (): boolean => {
  const lastAppOpen = sessionStorage.getItem('lastAppOpen');
  const today = getTodayString();

  if (!lastAppOpen) {
    sessionStorage.setItem('lastAppOpen', today);
    return false;
  }

  if (lastAppOpen !== today) {
    sessionStorage.setItem('lastAppOpen', today);
    return true;
  }

  return false;
}