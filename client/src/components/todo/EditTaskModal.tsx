"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { TaskData } from '@/types/todoTypes';
import { todoApi } from '@/lib/api/todos';
import { CreateTaskData, EditTaskModalProps } from '@/types/todoTypes';
import { updateTaskData } from '@/lib/api/transformers';
import { DAYS_OF_WEEK, DAY_ABBREVIATIONS } from '@/lib/utils/constants';

interface EditableTaskData extends CreateTaskData {
  is_recurring?: boolean;
  recurring_days?: string[];
  is_schedule?: boolean;
}

export default function EditTaskModal({ open, onOpenChange, task, onTaskUpdated }: EditTaskModalProps) {
  const [editableTask, setEditableTask] = useState<EditableTaskData>({
    title: '',
    section: 'daily',
    priority: 'low',
    description: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: '',
    is_recurring: false,
    recurring_days: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when task changes or modal opens
  useEffect(() => {
    if (task && open) {
      setEditableTask({
        title: task.title || '',
        section: task.section || 'daily',
        priority: task.priority || 'low',
        description: task.description || '',
        start_date: task.start_date || '',
        end_date: task.end_date || '',
        start_time: task.start_time || '',
        end_time: task.end_time || '',
        is_recurring: task.is_recurring || false,
        recurring_days: task.recurring_days || [],
        is_schedule: task.is_schedule || false,
      });
      setError(null);
    }
  }, [task, open]);

  // HELPER FUNCTIONS
  const updateField = (field: keyof EditableTaskData, value: any) => {
    setEditableTask(prev => ({ ...prev, [field]: value }));
  };

  // Day selection helpers
  const toggleDay = (day: string) => {
    setEditableTask(prev => {
      const currentDays = prev.recurring_days || [];
      const newDays = currentDays.includes(day)
        ? currentDays.filter(d => d !== day)
        : [...currentDays, day];

      return {
        ...prev,
        recurring_days: newDays,
        is_recurring: newDays.length > 0
      };
    });
  };

  const toggleEveryDay = (checked: boolean) => {
    setEditableTask(prev => {
      const newDays = checked ? [...DAYS_OF_WEEK] : [];
      return {
        ...prev,
        recurring_days: newDays,
        is_recurring: newDays.length > 0
      };
    });
  };

  const isEveryDaySelected = (): boolean => {
    return editableTask.recurring_days?.length === 7 || false;
  };

  const isDaySelected = (day: string): boolean => {
    return editableTask.recurring_days?.includes(day) || false;
  };

  const getRecurringDescription = (): string => {
    if (!editableTask.is_recurring || !editableTask.recurring_days || editableTask.recurring_days.length === 0) {
      return '';
    }

    const days = editableTask.recurring_days;
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

  const handleSave = async () => {
    if (!task?.id) return;

    setError(null);
    setIsSubmitting(true);

    try {
      // Validate required fields
      if (!editableTask.title.trim()) {
        setError('Task title is required.');
        setIsSubmitting(false);
        return;
      }

      // Validate recurring tasks have at least one day selected
      if (editableTask.is_recurring && (!editableTask.recurring_days || editableTask.recurring_days.length === 0)) {
        setError('Recurring tasks must have at least one day selected.');
        setIsSubmitting(false);
        return;
      }

      // Prepare the task data with proper formatting
      let taskDataToUpdate = {
        ...editableTask,
        recurring_days: editableTask.recurring_days?.map(day => day.toLowerCase()) || [],
        start_date: editableTask.start_date?.trim() || undefined,
        end_date: editableTask.end_date?.trim() || undefined,
        start_time: editableTask.start_time?.trim() || undefined,
        end_time: editableTask.end_time?.trim() || undefined,
        description: editableTask.description?.trim() || undefined
      };

      // If not recurring, explicitly set recurring fields to their default values
      if (!editableTask.is_recurring) {
        taskDataToUpdate = {
          ...taskDataToUpdate,
          is_recurring: false,
          recurring_days: []
        };
      }

      // Prepare updates (only send fields that actually have values)
      const updates: Partial<TaskData> = updateTaskData(taskDataToUpdate);

      console.log('Sending updates to backend:', updates);

      // Send to backend
      await todoApi.update(task.id, updates);

      // Notify parent component
      onTaskUpdated();

      // Close modal
      onOpenChange(false);

    } catch (error) {
      console.error('Error updating task:', error);
      setError(error instanceof Error ? error.message : 'Failed to update task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setError(null);
    onOpenChange(false);
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Edit Task</DialogTitle>
            {editableTask.is_recurring && (
              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                Recurring: {getRecurringDescription()}
              </span>
            )}
          </div>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Task Input */}
          <div>
            <label className="text-sm font-medium mb-2 block">Task Name *</label>
            <Input
              placeholder="Enter task name..."
              value={editableTask.title}
              onChange={(e) => updateField('title', e.target.value)}
              className="w-full"
              disabled={isSubmitting}
            />
          </div>

          {/* Description Input */}
          <div>
            <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
            <Input
              placeholder="Enter task description..."
              value={editableTask.description}
              onChange={(e) => updateField('description', e.target.value)}
              className="w-full"
              disabled={isSubmitting}
            />
          </div>

          {/* Section and Priority Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Section</label>
              <Select
                value={editableTask.section}
                onValueChange={(value) => updateField('section', value)}
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
                value={editableTask.priority}
                onValueChange={(value) => updateField('priority', value)}
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
            <div className="flex items-center gap-2">
              <Checkbox
                id="recurring"
                checked={editableTask.is_recurring}
                onCheckedChange={(checked) => {
                  updateField('is_recurring', checked === true);
                  if (checked !== true) {
                    updateField('recurring_days', []);
                  }
                }}
                disabled={isSubmitting}
              />
              <Label htmlFor="recurring" className="text-sm font-medium">
                Make this task recurring
              </Label>
            </div>

            {editableTask.is_recurring && (
              <div className="space-y-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
                {/* Everyday Toggle */}
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="everyday"
                    checked={isEveryDaySelected()}
                    onCheckedChange={(checked) => toggleEveryDay(checked === true)}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="everyday" className="text-sm font-medium">
                    Every day
                  </Label>
                </div>

                {/* Individual Day Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Or select specific days:</label>
                  <div className="grid grid-cols-7 gap-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <div key={day} className="flex flex-col items-center">
                        <Checkbox
                          id={day}
                          checked={isDaySelected(day)}
                          onCheckedChange={() => toggleDay(day)}
                          disabled={isSubmitting}
                        />
                        <Label
                          htmlFor={day}
                          className="text-xs mt-1 cursor-pointer"
                        >
                          {DAY_ABBREVIATIONS[day]}
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
                value={editableTask.start_date}
                onChange={(e) => updateField('start_date', e.target.value)}
                className="w-full"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <Input
                type="date"
                value={editableTask.end_date}
                onChange={(e) => updateField('end_date', e.target.value)}
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
                value={editableTask.start_time}
                onChange={(e) => updateField('start_time', e.target.value)}
                className="w-full"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">End Time</label>
              <Input
                type="time"
                value={editableTask.end_time}
                onChange={(e) => updateField('end_time', e.target.value)}
                className="w-full"
                disabled={isSubmitting}
              />
            </div>
          </div>
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
            onClick={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}