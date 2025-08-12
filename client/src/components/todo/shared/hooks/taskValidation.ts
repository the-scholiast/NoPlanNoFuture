import { getTodayString } from '@/lib/utils/dateUtils';
import { TaskFormData } from '../components';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Validate a single task
export function validateSingleTask(task: TaskFormData, taskLabel: string = 'Task'): ValidationResult {
  const errors: string[] = [];

  // Validate required fields
  if (!task.title.trim()) {
    errors.push(`${taskLabel}: Task title is required.`);
  }

  // Validate recurring tasks have at least one day selected
  if (task.is_recurring && (!task.recurring_days || task.recurring_days.length === 0)) {
    errors.push(`${taskLabel}: Recurring tasks must have at least one day selected.`);
  }

  // Validate date ranges
  if (task.start_date && task.end_date) {
    if (task.end_date <= task.start_date) {
      errors.push(`${taskLabel}: End date must be after start date.`);
    }
  }

  // Validate time ranges when both dates and times are set
  if (task.start_time && task.end_time) {
    // If same date or no dates set, validate time order
    if (!task.start_date || !task.end_date || task.start_date === task.end_date) {
      if (task.end_time <= task.start_time) {
        errors.push(`${taskLabel}: End time must be after start time when on the same date.`);
      }
    }
  }

  // Validate section-specific rules
  if (task.section === 'today') {
    if (task.is_recurring) {
      errors.push(`${taskLabel}: Today tasks cannot be recurring.`);
    }
    if (task.end_date) {
      errors.push(`${taskLabel}: Today tasks cannot have an end date.`);
    }
    if (task.start_date && task.start_date !== getTodayString()) {
      errors.push(`${taskLabel}: Today tasks must have today's date as start date.`);
    }
  }

  if (task.section === 'upcoming') {
    if (task.is_recurring) {
      errors.push(`${taskLabel}: Upcoming tasks cannot be recurring.`);
    }
  }

  if (task.section === 'daily') {
    if (!task.is_recurring) {
      errors.push(`${taskLabel}: Daily tasks must be recurring.`);
    }
    if (!task.recurring_days || task.recurring_days.length === 0) {
      errors.push(`${taskLabel}: Daily tasks must have either everyday selected or at least one specific day selected.`);
    }
  }

  // Validate date formats (basic check)
  if (task.start_date && !/^\d{4}-\d{2}-\d{2}$/.test(task.start_date)) {
    errors.push(`${taskLabel}: Invalid start date format.`);
  }

  if (task.end_date && !/^\d{4}-\d{2}-\d{2}$/.test(task.end_date)) {
    errors.push(`${taskLabel}: Invalid end date format.`);
  }

  // Validate time formats (basic check)
  if (task.start_time && !/^\d{2}:\d{2}$/.test(task.start_time)) {
    errors.push(`${taskLabel}: Invalid start time format.`);
  }

  if (task.end_time && !/^\d{2}:\d{2}$/.test(task.end_time)) {
    errors.push(`${taskLabel}: Invalid end time format.`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validate multiple tasks (for add modal)
export function validateMultipleTasks(tasks: TaskFormData[]): ValidationResult {
  // Filter tasks with valid task names
  const validTasks = tasks.filter(task => task.title.trim() !== '');

  if (validTasks.length === 0) {
    return {
      isValid: false,
      errors: ['Please add at least one task with a valid name.']
    };
  }

  const allErrors: string[] = [];

  validTasks.forEach((task, index) => {
    const taskNum = index + 1;
    const validation = validateSingleTask(task, `Task ${taskNum}`);
    allErrors.push(...validation.errors);
  });

  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
}

// Validate for edit modal (single task)
export function validateEditTask(task: TaskFormData): ValidationResult {
  return validateSingleTask(task);
}