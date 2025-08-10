"use client"

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TaskData, AddTaskModalProps, CreateTaskData, InternalTaskData } from '@/types/todoTypes';
import { todoApi } from '@/lib/api/todos';
import { transformCreateTaskData } from '@/lib/api/transformers';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const DAYS_OF_WEEK = [
  { key: 'sunday', label: 'Sun' },
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' }
];

export default function AddTaskModal({ open, onOpenChange, onAddTasks }: AddTaskModalProps) {
  // Get current date for today tasks
  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const placeholderTask: InternalTaskData = {
    id: '1',
    title: '',
    section: 'daily',
    priority: 'low',
    description: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    is_recurring: true,
    recurring_days: DAYS_OF_WEEK.map(d => d.key), // Default to every day for daily tasks
    is_schedule: false,
  };

  const [tasks, setTasks] = useState<InternalTaskData[]>([placeholderTask]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // HELPER FUNCTIONS
  const addNewTask = () => {
    const newTask: InternalTaskData = {
      ...placeholderTask,
      id: Date.now().toString(), // Unique ID for each task
      is_recurring: true,
      recurring_days: DAYS_OF_WEEK.map(d => d.key), // Default to every day for daily tasks
    };
    setTasks(prev => [...prev, newTask]);
  };

  const updateTask = (id: string, field: keyof InternalTaskData, value: any) => {
    setTasks(prev => prev.map(task => {
      if (task.id === id) {
        const updatedTask = { ...task, [field]: value };

        // Handle section-specific logic
        if (field === 'section') {
          if (value === 'daily') {
            // Daily tasks: automatically make recurring and select every day
            updatedTask.is_recurring = true;
            updatedTask.recurring_days = DAYS_OF_WEEK.map(d => d.key);
            // Clear dates for daily tasks
            updatedTask.start_date = '';
            updatedTask.end_date = '';
          } else if (value === 'today') {
            // Today tasks: set start date to current date, disable end date and recurring
            updatedTask.start_date = getCurrentDate();
            updatedTask.end_date = '';
            updatedTask.is_recurring = false;
            updatedTask.recurring_days = [];
          } else if (value === 'upcoming') {
            // Upcoming tasks: disable recurring
            updatedTask.is_recurring = false;
            updatedTask.recurring_days = [];
            // Clear start date if it's today's date
            if (updatedTask.start_date === getCurrentDate()) {
              updatedTask.start_date = '';
            }
          }
        }

        // Handle date validation logic
        if (field === 'start_date' && value) {
          // If end date exists and is less than or equal to start date, clear it
          if (updatedTask.end_date && updatedTask.end_date <= value) {
            updatedTask.end_date = '';
          }
        }

        if (field === 'start_time' && value) {
          // If end time exists and start time >= end time on same date, clear end time
          if (updatedTask.end_time &&
            updatedTask.start_date === updatedTask.end_date &&
            value >= updatedTask.end_time) {
            updatedTask.end_time = '';
          }
        }

        return updatedTask;
      }
      return task;
    }));
  };

  const removeTask = (id: string) => {
    if (tasks.length > 1) {
      setTasks(prev => prev.filter(task => task.id !== id));
    }
  };

  // Day selection helpers
  const toggleDay = (taskId: string, day: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const currentDays = task.recurring_days || [];
        const newDays = currentDays.includes(day)
          ? currentDays.filter(d => d !== day)
          : [...currentDays, day];

        return {
          ...task,
          recurring_days: newDays,
          is_recurring: newDays.length > 0
        };
      }
      return task;
    }));
  };

  const toggleEveryDay = (taskId: string, checked: boolean) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const newDays = checked ? DAYS_OF_WEEK.map(d => d.key) : [];
        return {
          ...task,
          recurring_days: newDays,
          is_recurring: newDays.length > 0
        };
      }
      return task;
    }));
  };

  const isEveryDaySelected = (taskId: string): boolean => {
    const task = tasks.find(t => t.id === taskId);
    return task?.recurring_days?.length === 7 || false;
  };

  const isDaySelected = (taskId: string, day: string): boolean => {
    const task = tasks.find(t => t.id === taskId);
    return task?.recurring_days?.includes(day) || false;
  };

  // Check if recurring section should be shown (only for daily tasks)
  const shouldShowRecurring = (task: InternalTaskData): boolean => {
    return task.section === 'daily';
  };

  // Check if end date should be disabled (for today tasks)
  const isEndDateDisabled = (task: InternalTaskData): boolean => {
    return task.section === 'today';
  };

  // Check if recurring checkbox should be disabled (for today and upcoming tasks)
  const isRecurringDisabled = (task: InternalTaskData): boolean => {
    return task.section === 'today' || task.section === 'upcoming';
  };

  // Get minimum date for end date (must be after start date)
  const getMinEndDate = (task: InternalTaskData): string => {
    if (!task.start_date) return '';

    // Add one day to start date
    const startDate = new Date(task.start_date);
    startDate.setDate(startDate.getDate() + 1);
    return startDate.toISOString().split('T')[0];
  };

  // Validate end date when user finishes typing (onBlur)
  const handleEndDateBlur = (taskId: string, value: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.start_date || !value) {
      return;
    }

    // If end date is invalid (less than or equal to start date), clear it
    if (value <= task.start_date) {
      updateTask(taskId, 'end_date', '');
    }
  };

  const handleApply = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      // Filter tasks with valid task names
      const validTasks = tasks.filter(task => task.title.trim() !== '');

      if (validTasks.length === 0) {
        setError('Please add at least one task with a valid name.');
        setIsSubmitting(false);
        return;
      }

      // Comprehensive validation checks
      const validationErrors: string[] = [];

      validTasks.forEach((task, index) => {
        const taskNum = index + 1;

        // Validate recurring tasks have at least one day selected
        if (task.is_recurring && (!task.recurring_days || task.recurring_days.length === 0)) {
          validationErrors.push(`Task ${taskNum}: Recurring tasks must have at least one day selected.`);
        }

        // Validate date ranges
        if (task.start_date && task.end_date) {
          if (task.end_date <= task.start_date) {
            validationErrors.push(`Task ${taskNum}: End date must be after start date.`);
          }
        }

        // Validate time ranges when both dates and times are set
        if (task.start_time && task.end_time) {
          // If same date or no dates set, validate time order
          if (!task.start_date || !task.end_date || task.start_date === task.end_date) {
            if (task.end_time <= task.start_time) {
              validationErrors.push(`Task ${taskNum}: End time must be after start time when on the same date.`);
            }
          }
        }

        // Validate section-specific rules
        if (task.section === 'today') {
          if (task.is_recurring) {
            validationErrors.push(`Task ${taskNum}: Today tasks cannot be recurring.`);
          }
          if (task.end_date) {
            validationErrors.push(`Task ${taskNum}: Today tasks cannot have an end date.`);
          }
          if (task.start_date && task.start_date !== getCurrentDate()) {
            validationErrors.push(`Task ${taskNum}: Today tasks must have today's date as start date.`);
          }
        }

        if (task.section === 'upcoming') {
          if (task.is_recurring) {
            validationErrors.push(`Task ${taskNum}: Upcoming tasks cannot be recurring.`);
          }
        }

        if (task.section === 'daily') {
          if (!task.is_recurring) {
            validationErrors.push(`Task ${taskNum}: Daily tasks must be recurring.`);
          }
          if (!task.recurring_days || task.recurring_days.length === 0) {
            validationErrors.push(`Task ${taskNum}: Daily tasks must have either everyday selected or at least one specific day selected.`);
          }
        }

        // Validate date formats (basic check)
        if (task.start_date && !/^\d{4}-\d{2}-\d{2}$/.test(task.start_date)) {
          validationErrors.push(`Task ${taskNum}: Invalid start date format.`);
        }

        if (task.end_date && !/^\d{4}-\d{2}-\d{2}$/.test(task.end_date)) {
          validationErrors.push(`Task ${taskNum}: Invalid end date format.`);
        }

        // Validate time formats (basic check)
        if (task.start_time && !/^\d{2}:\d{2}$/.test(task.start_time)) {
          validationErrors.push(`Task ${taskNum}: Invalid start time format.`);
        }

        if (task.end_time && !/^\d{2}:\d{2}$/.test(task.end_time)) {
          validationErrors.push(`Task ${taskNum}: Invalid end time format.`);
        }
      });

      // If there are validation errors, show them and stop
      if (validationErrors.length > 0) {
        setError(validationErrors.join('\n'));
        setIsSubmitting(false);
        return;
      }

      // Transform InternalTaskData to CreateTaskData format
      const tasksToCreate: CreateTaskData[] = validTasks.map(transformCreateTaskData);

      // Send to backend
      const createdTasks: TaskData[] = await Promise.all(
        tasksToCreate.map(taskData => todoApi.create(taskData))
      );

      // Pass the created tasks to the parent component
      onAddTasks(createdTasks);

      // Reset the modal state with proper defaults
      const resetTask = {
        ...placeholderTask,
        is_recurring: true,
        recurring_days: DAYS_OF_WEEK.map(d => d.key),
      };
      setTasks([resetTask]);

      onOpenChange(false);

    } catch (error) {
      console.error('Error creating tasks:', error);
      setError(error instanceof Error ? error.message : 'Failed to create tasks. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Reset the modal state with proper default values
    const resetTask = {
      ...placeholderTask,
      is_recurring: true,
      recurring_days: DAYS_OF_WEEK.map(d => d.key),
    };
    setTasks([resetTask]);
    setError(null);
    onOpenChange(false);
  };

  const getRecurringDescription = (task: InternalTaskData): string => {
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
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Tasks</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-sm p-3 rounded-md whitespace-pre-line">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Task List */}
          {tasks.map((task, index) => (
            <div key={task.id} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 space-y-4">
              {/* Header Row with Task Label and Remove Button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">Task {index + 1}</span>
                  {task.is_recurring && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                      Recurring: {getRecurringDescription(task)}
                    </span>
                  )}
                </div>

                {/* Remove Task Button */}
                {tasks.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTask(task.id)}
                    disabled={isSubmitting}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Task Name */}
              <div>
                <Input
                  placeholder="Enter task name..."
                  value={task.title}
                  onChange={(e) => updateTask(task.id, 'title', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              {/* Description */}
              <div>
                <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
                <Input
                  placeholder="Enter task description..."
                  value={task.description}
                  onChange={(e) => updateTask(task.id, 'description', e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              {/* Section and Priority Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Section</label>
                  <Select
                    value={task.section}
                    onValueChange={(value) => updateTask(task.id, 'section', value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Priority</label>
                  <Select
                    value={task.priority}
                    onValueChange={(value) => updateTask(task.id, 'priority', value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Recurring Section - Only show day selection for daily tasks */}
              {shouldShowRecurring(task) && (
                <div className="space-y-3">
                  <div className="space-y-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
                    {/* Everyday Toggle */}
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`everyday-${task.id}`}
                        checked={isEveryDaySelected(task.id)}
                        onCheckedChange={(checked) => toggleEveryDay(task.id, checked === true)}
                        disabled={isSubmitting}
                      />
                      <Label htmlFor={`everyday-${task.id}`} className="text-sm font-medium">
                        Every day
                      </Label>
                    </div>

                    {/* Individual Day Selection */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Or select specific days:</label>
                      <div className="grid grid-cols-7 gap-2">
                        {DAYS_OF_WEEK.map((day) => (
                          <div key={day.key} className="flex flex-col items-center">
                            <Checkbox
                              id={`${task.id}-${day.key}`}
                              checked={isDaySelected(task.id, day.key)}
                              onCheckedChange={() => toggleDay(task.id, day.key)}
                              disabled={isSubmitting}
                            />
                            <Label
                              htmlFor={`${task.id}-${day.key}`}
                              className="text-xs mt-1 cursor-pointer"
                            >
                              {day.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Date Range Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Start Date</label>
                  <Input
                    type="date"
                    value={task.start_date}
                    onChange={(e) => updateTask(task.id, 'start_date', e.target.value)}
                    disabled={isSubmitting || task.section === 'today'}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">End Date</label>
                  <Input
                    type="date"
                    value={task.end_date}
                    onChange={(e) => updateTask(task.id, 'end_date', e.target.value)}
                    onBlur={(e) => handleEndDateBlur(task.id, e.target.value)}
                    disabled={isSubmitting || isEndDateDisabled(task)}
                    min={getMinEndDate(task)}
                  />
                </div>
              </div>

              {/* Time Range Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Start Time</label>
                  <Input
                    type="time"
                    value={task.start_time}
                    onChange={(e) => updateTask(task.id, 'start_time', e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">End Time</label>
                  <Input
                    type="time"
                    value={task.end_time}
                    onChange={(e) => updateTask(task.id, 'end_time', e.target.value)}
                    disabled={isSubmitting}
                    min={task.start_date === task.end_date ? task.start_time : undefined}
                  />
                </div>
              </div>

              {/* Add to Calendar/Timetable */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`schedule-${task.id}`}
                  checked={task.is_schedule}
                  onCheckedChange={(checked) => updateTask(task.id, 'is_schedule', checked === true)}
                  disabled={isSubmitting}
                />
                <Label htmlFor={`schedule-${task.id}`} className="text-sm font-medium">
                  Add to calendar/timetable
                </Label>
              </div>
            </div>
          ))}

          {/* Add Another Task Button */}
          <Button
            variant="outline"
            onClick={addNewTask}
            disabled={isSubmitting}
            className="w-full"
          >
            + Add Another Task
          </Button>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Apply'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}