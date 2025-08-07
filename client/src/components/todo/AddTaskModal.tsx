"use client"

import React, { useState } from 'react';
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
    is_recurring: false,
    recurring_days: [],
    is_schedule: false,
  };

  const [tasks, setTasks] = useState<InternalTaskData[]>([placeholderTask]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // HELPER FUNCTIONS
  const addNewTask = () => {
    const newTask: InternalTaskData = {
      ...placeholderTask,
      id: Date.now().toString() // Unique ID for each task
    };
    setTasks(prev => [...prev, newTask]);
  };

  const updateTask = (id: string, field: keyof InternalTaskData, value: any) => {
    setTasks(prev => prev.map(task =>
      task.id === id ? { ...task, [field]: value } : task
    ));
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

      // Validate recurring tasks have at least one day selected
      const invalidRecurringTasks = validTasks.filter(task =>
        task.is_recurring && (!task.recurring_days || task.recurring_days.length === 0)
      );

      if (invalidRecurringTasks.length > 0) {
        setError('Recurring tasks must have at least one day selected.');
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

      // Reset the modal state
      setTasks([placeholderTask]);

      onOpenChange(false);

    } catch (error) {
      console.error('Error creating tasks:', error);
      setError(error instanceof Error ? error.message : 'Failed to create tasks. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Reset the modal state
    setTasks([placeholderTask]);
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
          <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-sm p-3 rounded-md">
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
                    className="h-6 w-6 p-0 text-gray-500 hover:text-red-500"
                    onClick={() => removeTask(task.id)}
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Task Input */}
              <div>
                <Input
                  placeholder="Enter task name..."
                  value={task.title}
                  onChange={(e) => updateTask(task.id, 'title', e.target.value)}
                  className="w-full"
                  disabled={isSubmitting}
                />
              </div>

              {/* Description Input */}
              <div>
                <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
                <Input
                  placeholder="Enter task description..."
                  value={task.description}
                  onChange={(e) => updateTask(task.id, 'description', e.target.value)}
                  className="w-full"
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
                    <SelectTrigger className="w-full">
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
                    <SelectTrigger className="w-full">
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

              {/* Recurring Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`recurring-${task.id}`}
                      checked={task.is_recurring}
                      onCheckedChange={(checked) => {
                        updateTask(task.id, 'is_recurring', checked === true);
                        if (checked !== true) {
                          updateTask(task.id, 'recurring_days', []);
                        }
                      }}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor={`recurring-${task.id}`} className="text-sm font-medium">
                      Make this task recurring
                    </Label>
                  </div>
                  {/* Calendar/timetable checkbox */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`schedule-${task.id}`}
                      checked={task.is_schedule || false}
                      onCheckedChange={(checked) => updateTask(task.id, 'is_schedule', checked)}
                      disabled={isSubmitting}
                    />
                    <Label htmlFor={`schedule-${task.id}`} className="text-sm">
                      Add to calendar/timetable
                    </Label>
                  </div>
                </div>

                {task.is_recurring && (
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
                )}
              </div>

              {/* Date Range Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Start Date</label>
                  <Input
                    type="date"
                    value={task.start_date}
                    onChange={(e) => updateTask(task.id, 'start_date', e.target.value)}
                    className="w-full"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">End Date</label>
                  <Input
                    type="date"
                    value={task.end_date}
                    onChange={(e) => updateTask(task.id, 'end_date', e.target.value)}
                    className="w-full"
                    disabled={isSubmitting}
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
                    className="w-full"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">End Time</label>
                  <Input
                    type="time"
                    value={task.end_time}
                    onChange={(e) => updateTask(task.id, 'end_time', e.target.value)}
                    className="w-full"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Add Task Button */}
          <Button
            variant="outline"
            onClick={addNewTask}
            className="w-full border-dashed"
            disabled={isSubmitting}
          >
            + Add Another Task
          </Button>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApply}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Apply'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}