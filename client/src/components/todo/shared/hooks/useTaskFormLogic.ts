'use client'

import { useCallback, useState } from 'react';
import { DAYS_OF_WEEK } from '@/lib/utils/constants';
import { formatDateString, getTodayString } from '@/lib/utils/dateUtils';
import { TaskFormData } from '../components/TaskFormComponents';
import { TaskFormDataValue } from '../types';

/**
 * Core logic for task form management
 * Handle section-specific rules, date/time validation, and recurring patterns
 * Used by AddTaskModal, EditTaskModal, and form components throughout the app
 */
class TaskLogicHelper {
  /**
   * Central update method that applies rules when any task field changes
   * Ensures data consistency across the entire form (e.g., section changes affect dates/recurring)
   */
  static updateTaskField<T extends TaskFormData>(task: T, field: keyof TaskFormData, value: TaskFormDataValue): T {
    const updatedTask = { ...task, [field]: value };
    // Apply rules based on which field changed
    if (field === 'section') {
      this.applySectionLogic(updatedTask, value as string);
    }
    if (field === 'start_date' && value) {
      this.validateStartDate(updatedTask, value as string);
    }
    if (field === 'start_time' && value) {
      this.validateStartTime(updatedTask, value as string);
    }
    if (field === 'is_recurring' && value !== true) {
      updatedTask.recurring_days = [];
    }
    return updatedTask;
  }

  /**
   * Implement section-specific rules for the todo board organization:
   * - daily: Auto-recurring, all days selected 
   * - today: Single day only, today's date, no recurring  
   * - upcoming: Future tasks, no recurring by default 
   * - none: Flexible scheduling, can be recurring 
   */
  private static applySectionLogic<T extends TaskFormData>(updatedTask: T, section: string): void {
    if (section === 'daily') {
      updatedTask.is_recurring = true;
      updatedTask.recurring_days = [...DAYS_OF_WEEK];
    } else if (section === 'today') {
      updatedTask.start_date = updatedTask.start_date || getTodayString();
      updatedTask.end_date = '';
      updatedTask.is_recurring = false;
      updatedTask.recurring_days = [];
    } else if (section === 'upcoming') {
      updatedTask.is_recurring = false;
      updatedTask.recurring_days = [];
      if (updatedTask.start_date === getTodayString()) {
        updatedTask.start_date = updatedTask.start_date || '';
      }
    } else if (section === 'none') {
      updatedTask.end_date = '';
      updatedTask.is_schedule = true;
    }
  }

  // Date validation: If end date becomes invalid due to start date change, clear it (prevent impossible date ranges in the UI)
  private static validateStartDate<T extends TaskFormData>(updatedTask: T, value: string): void {
    if (updatedTask.end_date && updatedTask.end_date <= value) {
      updatedTask.end_date = '';
    }
  }

  // Time validation: If end time becomes invalid due to start time change, clear it (Only applies when both times are on the same date)
  private static validateStartTime<T extends TaskFormData>(updatedTask: T, value: string): void {
    if (
      updatedTask.end_time &&
      updatedTask.start_date === updatedTask.end_date &&
      value >= updatedTask.end_time
    ) {
      updatedTask.end_time = '';
    }
  }
}

/**
 * Utility helpers for common task operations
 * Create reusable functions for day selection and form validation
 * Used by both single task forms (EditTaskModal) and multi-task forms (AddTaskModal)
 */
class TaskHelpers {
  /**
 * Create day selection helpers for recurring task management
 * Handles the complex logic of day toggles, "every day" shortcuts, and descriptions
 */
  static createDayHelpers<T extends TaskFormData>(
    task: T,
    updateCallback: (field: keyof TaskFormData, value: TaskFormDataValue) => void
  ) {
    return {
      // Toggle individual days for recurring tasks
      toggleDay: (day: string) => {
        const currentDays = task.recurring_days || [];
        const newDays = currentDays.includes(day)
          ? currentDays.filter(d => d !== day)
          : [...currentDays, day];

        updateCallback('recurring_days', newDays);
        updateCallback('is_recurring', newDays.length > 0);
      },
      // Toggle all days at once (used by "Every day" checkbox)
      toggleEveryDay: (checked: boolean) => {
        const newDays = checked ? [...DAYS_OF_WEEK] : [];
        updateCallback('recurring_days', newDays);
        updateCallback('is_recurring', newDays.length > 0);
      },
      // Check if all days are selected (for "Every day" checkbox state)
      isEveryDaySelected: (): boolean => {
        return task.recurring_days?.length === 7 || false;
      },
      // Check if specific day is selected (for individual day checkboxes)
      isDaySelected: (day: string): boolean => {
        return task.recurring_days?.includes(day) || false;
      },
    };
  }


  // Create validation helpers for date/time constraints and ensure proper date ranges and prevents invalid time combinations
  static createValidationHelpers<T extends TaskFormData>(task: T) {
    return {
      // Determine when end date field should be disabled based on section rules
      isEndDateDisabled: (): boolean => {
        return task.section === 'today' || task.section === 'upcoming' || (task.section === 'none' && !task.is_recurring);
      },
      // Calculate minimum valid end date (day after start date)
      getMinEndDate: (): string => {
        if (!task.start_date) return '';
        const startDate = new Date(task.start_date);
        startDate.setDate(startDate.getDate() + 1);
        return formatDateString(startDate);
      },
      // Validate end date when user finishes editing
      handleEndDateBlur: (value: string, updateCallback: (field: keyof TaskFormData, value: TaskFormDataValue) => void) => {
        if (!task.start_date || !value) return;
        // Clear invalid end dates (same day or before start date)
        if (value <= task.start_date) {
          updateCallback('end_date', '');
        }
      }
    };
  }
}

/**
 * Single task hook - Used by EditTaskModal
 * Manage individual task state with full logic integration
 * Provide helpers needed for editing existing tasks
 */
export function useTaskFormLogic(initialTask?: Partial<TaskFormData>) {
  const [task, setTask] = useState<TaskFormData>({
    title: '',
    section: 'daily',
    priority: 'low',
    description: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    is_recurring: false,
    recurring_days: [],
    is_schedule: false,
    ...initialTask
  });
  // Central update function that applies all rules
  const updateField = (field: keyof TaskFormData, value: TaskFormDataValue) => {
    setTask(prev => TaskLogicHelper.updateTaskField(prev, field, value));
  };
  // Create helper functions bound to this specific task
  const dayHelpers = TaskHelpers.createDayHelpers(task, updateField);
  const validationHelpers = TaskHelpers.createValidationHelpers(task);

  return {
    task,
    setTask,
    updateField,
    ...dayHelpers,
    ...validationHelpers,
  };
}

/**
 * Multi-task hook - Used by AddTaskModal  
 * Manages multiple tasks simultaneously with individual IDs
 * Allows adding/removing tasks and provides per-task helper functions
 */
export function useMultiTaskFormLogic() {
  // Default task template for new tasks (daily recurring by default)
  const placeholderTask: TaskFormData = {
    title: '',
    section: 'daily',
    priority: 'low',
    description: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    is_recurring: true,
    recurring_days: [...DAYS_OF_WEEK],
    is_schedule: false,
  };

  // Array of tasks, each with unique ID for React key prop
  const [tasks, setTasks] = useState<(TaskFormData & { id: string })[]>([
    { ...placeholderTask, id: '1' }
  ]);

  // Add new task to the list (used by "Add Another Task" button)
  const addNewTask = useCallback(() => {
    const newTask = {
      ...placeholderTask,
      id: Date.now().toString(),
      is_recurring: true,
      recurring_days: [...DAYS_OF_WEEK],
    };
    setTasks(prev => [...prev, newTask]);
  }, [placeholderTask]);

  // Remove task from list (minimum 1 task required)
  const removeTask = useCallback((id: string) => {
    if (tasks.length > 1) {
      setTasks(prev => prev.filter(task => task.id !== id));
    }
  }, [tasks.length]);

  // Update specific task field with logic applied
  const updateTask = useCallback((id: string, field: keyof TaskFormData, value: TaskFormDataValue) => {
    setTasks(prev => prev.map(task => {
      if (task.id === id) {
        return TaskLogicHelper.updateTaskField(task, field, value);
      }
      return task;
    }));
  }, []);

  /**
   * Get task-specific helper functions for individual tasks in the array
   * Each task gets its own set of day toggles and validation helpers
   * Used by AddTaskModal to render multiple task forms
   */
  const getTaskHelpers = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) throw new Error(`Task with id ${taskId} not found`);
    // Create update callback bound to this specific task
    const updateCallback = (field: keyof TaskFormData, value: TaskFormDataValue) => {
      updateTask(taskId, field, value);
    };

    const dayHelpers = TaskHelpers.createDayHelpers(task, updateCallback);
    const validationHelpers = TaskHelpers.createValidationHelpers(task);

    const handleEndDateBlur = (value: string) => {
      validationHelpers.handleEndDateBlur(value, updateCallback);
    };

    return {
      ...dayHelpers,
      ...validationHelpers,
      handleEndDateBlur
    };
  };

  // Reset to single default task (used when modal closes/resets)
  const resetTasks = useCallback(() => {
    const resetTask = {
      ...placeholderTask,
      id: '1',
      is_recurring: true,
      recurring_days: [...DAYS_OF_WEEK],
    };
    setTasks([resetTask]);
  }, [placeholderTask]);

  // Initialize with pre-filled data (used when adding scheduled tasks from calendar)
  const initializeWithData = useCallback((initialData: Partial<TaskFormData>) => {
    const initialTask = {
      ...placeholderTask,
      ...initialData,
      id: '1',
    };
    setTasks([initialTask]);
  }, [placeholderTask]);

  // Copy task to create a duplicate with new ID (used by "Copy Task" button)
  const copyTask = useCallback((id: string) => {
    const taskToCopy = tasks.find(t => t.id === id);
    if (!taskToCopy) return;

    const copiedTask = {
      ...taskToCopy,
      id: Date.now().toString(),
      title: taskToCopy.title ? `${taskToCopy.title} (Copy)` : '',
    };
    setTasks(prev => [...prev, copiedTask]);
  }, [tasks]);

  return {
    tasks,
    addNewTask,
    removeTask,
    updateTask,
    copyTask,
    getTaskHelpers,
    resetTasks,
    initializeWithData
  };
}