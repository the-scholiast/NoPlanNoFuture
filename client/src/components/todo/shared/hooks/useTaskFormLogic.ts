'use client'

import { useState } from 'react';
import { DAYS_OF_WEEK } from '@/lib/utils/constants';
import { formatDateString, getTodayString } from '@/lib/utils/dateUtils';
import { TaskFormData } from '../components';

// Shared task validation and update logic
class TaskLogicHelper {
  static updateTaskField<T extends TaskFormData>(
    task: T,
    field: keyof TaskFormData,
    value: any
  ): T {
    const updatedTask = { ...task, [field]: value };

    // Handle section-specific logic
    if (field === 'section') {
      this.applySectionLogic(updatedTask, value);
    }

    // Handle date validation logic
    if (field === 'start_date' && value) {
      this.validateStartDate(updatedTask, value);
    }

    if (field === 'start_time' && value) {
      this.validateStartTime(updatedTask, value);
    }

    // Handle recurring logic
    if (field === 'is_recurring' && value !== true) {
      updatedTask.recurring_days = [];
    }

    return updatedTask;
  }

  private static applySectionLogic<T extends TaskFormData>(updatedTask: T, section: string): void {
    if (section === 'daily') {
      // Daily tasks: automatically make recurring and select every day
      updatedTask.is_recurring = true;
      updatedTask.recurring_days = [...DAYS_OF_WEEK];
      // Clear dates for daily tasks
      updatedTask.start_date = '';
      updatedTask.end_date = '';
    } else if (section === 'today') {
      // Today tasks: set start date to current date, disable end date and recurring
      updatedTask.start_date = getTodayString();
      updatedTask.end_date = '';
      updatedTask.is_recurring = false;
      updatedTask.recurring_days = [];
    } else if (section === 'upcoming') {
      // Upcoming tasks: disable recurring
      updatedTask.is_recurring = false;
      updatedTask.recurring_days = [];
      // Clear start date if it's today's date
      if (updatedTask.start_date === getTodayString()) {
        updatedTask.start_date = '';
      }
    }
  }

  private static validateStartDate<T extends TaskFormData>(updatedTask: T, value: string): void {
    // If end date exists and is less than or equal to start date, clear it
    if (updatedTask.end_date && updatedTask.end_date <= value) {
      updatedTask.end_date = '';
    }
  }

  private static validateStartTime<T extends TaskFormData>(updatedTask: T, value: string): void {
    // If end time exists and start time >= end time on same date, clear end time
    if (
      updatedTask.end_time &&
      updatedTask.start_date === updatedTask.end_date &&
      value >= updatedTask.end_time
    ) {
      updatedTask.end_time = '';
    }
  }
}

// Shared helper functions for task operations
class TaskHelpers {
  static createDayHelpers<T extends TaskFormData>(
    task: T,
    updateCallback: (field: keyof TaskFormData, value: any) => void
  ) {
    return {
      toggleDay: (day: string) => {
        const currentDays = task.recurring_days || [];
        const newDays = currentDays.includes(day)
          ? currentDays.filter(d => d !== day)
          : [...currentDays, day];

        updateCallback('recurring_days', newDays);
        updateCallback('is_recurring', newDays.length > 0);
      },

      toggleEveryDay: (checked: boolean) => {
        const newDays = checked ? [...DAYS_OF_WEEK] : [];
        updateCallback('recurring_days', newDays);
        updateCallback('is_recurring', newDays.length > 0);
      },

      isEveryDaySelected: (): boolean => {
        return task.recurring_days?.length === 7 || false;
      },

      isDaySelected: (day: string): boolean => {
        return task.recurring_days?.includes(day) || false;
      },

      getRecurringDescription: (): string => {
        if (!task.is_recurring || !task.recurring_days || task.recurring_days.length === 0) {
          return '';
        }

        const days = task.recurring_days;
        const dayNames = days.map(day => day.charAt(0).toUpperCase() + day.slice(1));

        if (days.length === 7) {
          return 'Every day';
        }

        if (days.length === 5 && !days.includes('saturday') && !days.includes('sunday')) {
          return 'Weekdays only';
        }

        if (days.length === 2 && days.includes('saturday') && days.includes('sunday')) {
          return 'Weekends only';
        }

        if (days.length <= 3) {
          return dayNames.join(', ');
        }

        return `${days.length} days per week`;
      }
    };
  }

  static createValidationHelpers<T extends TaskFormData>(task: T) {
    return {
      shouldShowRecurring: (): boolean => {
        return task.section === 'daily';
      },

      isEndDateDisabled: (): boolean => {
        return task.section === 'today';
      },

      isRecurringDisabled: (): boolean => {
        return task.section === 'today' || task.section === 'upcoming';
      },

      getMinEndDate: (): string => {
        if (!task.start_date) return '';

        // Add one day to start date
        const startDate = new Date(task.start_date);
        startDate.setDate(startDate.getDate() + 1);
        return formatDateString(startDate);
      },

      handleEndDateBlur: (value: string, updateCallback: (field: keyof TaskFormData, value: any) => void) => {
        if (!task.start_date || !value) {
          return;
        }

        // If end date is invalid (less than or equal to start date), clear it
        if (value <= task.start_date) {
          updateCallback('end_date', '');
        }
      }
    };
  }
}

// Hook for managing individual task state and logic
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

  const updateField = (field: keyof TaskFormData, value: any) => {
    setTask(prev => TaskLogicHelper.updateTaskField(prev, field, value));
  };

  const dayHelpers = TaskHelpers.createDayHelpers(task, updateField);
  const validationHelpers = TaskHelpers.createValidationHelpers(task);

  const handleEndDateBlur = (value: string) => {
    validationHelpers.handleEndDateBlur(value, updateField);
  };

  return {
    task,
    setTask,
    updateField,
    ...dayHelpers,
    ...validationHelpers,
    handleEndDateBlur
  };
}

// Hook for managing multiple tasks (for add modal)
export function useMultiTaskFormLogic() {
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

  const [tasks, setTasks] = useState<(TaskFormData & { id: string })[]>([
    { ...placeholderTask, id: '1' }
  ]);

  const addNewTask = () => {
    const newTask = {
      ...placeholderTask,
      id: Date.now().toString(),
      is_recurring: true,
      recurring_days: [...DAYS_OF_WEEK],
    };
    setTasks(prev => [...prev, newTask]);
  };

  const removeTask = (id: string) => {
    if (tasks.length > 1) {
      setTasks(prev => prev.filter(task => task.id !== id));
    }
  };

  const updateTask = (id: string, field: keyof TaskFormData, value: any) => {
    setTasks(prev => prev.map(task => {
      if (task.id === id) {
        return TaskLogicHelper.updateTaskField(task, field, value);
      }
      return task;
    }));
  };

  // Task-specific helper functions
  const getTaskHelpers = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) throw new Error(`Task with id ${taskId} not found`);

    const updateCallback = (field: keyof TaskFormData, value: any) => {
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

  const resetTasks = () => {
    const resetTask = {
      ...placeholderTask,
      id: '1',
      is_recurring: true,
      recurring_days: [...DAYS_OF_WEEK],
    };
    setTasks([resetTask]);
  };

  return {
    tasks,
    setTasks,
    addNewTask,
    removeTask,
    updateTask,
    getTaskHelpers,
    resetTasks,
    placeholderTask
  };
}