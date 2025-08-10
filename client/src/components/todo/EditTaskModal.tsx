"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TaskData } from '@/types/todoTypes';
import { todoApi } from '@/lib/api/todos';
import { EditTaskModalProps } from '@/types/todoTypes';
import { updateTaskData } from '@/lib/api/transformers';

// Import shared components and hooks
import {
  TaskBasicFields,
  RecurringSection,
  DateTimeFields,
  TaskFormData
} from './shared/';
import { useTaskFormLogic } from './shared/';
import { validateEditTask } from './shared/';

export default function EditTaskModal({ open, onOpenChange, task, onTaskUpdated }: EditTaskModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use shared hook for task logic
  const {
    task: editableTask,
    setTask: setEditableTask,
    updateField,
    toggleDay,
    toggleEveryDay,
    isEveryDaySelected,
    isDaySelected,
    getRecurringDescription
  } = useTaskFormLogic();

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
  }, [task, open, setEditableTask]);

  const handleSave = async () => {
    if (!task?.id) return;

    setError(null);
    setIsSubmitting(true);

    try {
      // Validate the task
      const validation = validateEditTask(editableTask);
      if (!validation.isValid) {
        setError(validation.errors.join('\n'));
        setIsSubmitting(false);
        return;
      }

      // Prepare the task data with proper formatting
      let taskDataToUpdate: Partial<TaskData> = {
        title: editableTask.title,
        section: editableTask.section as 'daily' | 'today' | 'upcoming' | 'none',
        priority: editableTask.priority as 'low' | 'medium' | 'high',
        recurring_days: editableTask.recurring_days?.map(day => day.toLowerCase()) || [],
        start_date: editableTask.start_date?.trim() || undefined,
        end_date: editableTask.end_date?.trim() || undefined,
        start_time: editableTask.start_time?.trim() || undefined,
        end_time: editableTask.end_time?.trim() || undefined,
        description: editableTask.description?.trim() || undefined,
        is_recurring: editableTask.is_recurring,
        is_schedule: editableTask.is_schedule
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
          {/* Basic task fields */}
          <TaskBasicFields
            task={editableTask}
            updateField={updateField}
            isSubmitting={isSubmitting}
          />

          {/* Recurring Section */}
          <RecurringSection
            task={editableTask}
            updateField={updateField}
            isSubmitting={isSubmitting}
            showRecurringToggle={true}
            shouldShowSection={true}
            toggleDay={toggleDay}
            toggleEveryDay={toggleEveryDay}
            isEveryDaySelected={isEveryDaySelected}
            isDaySelected={isDaySelected}
            getRecurringDescription={getRecurringDescription}
          />

          {/* Date and Time Fields */}
          <DateTimeFields
            task={editableTask}
            updateField={updateField}
            isSubmitting={isSubmitting}
          />
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