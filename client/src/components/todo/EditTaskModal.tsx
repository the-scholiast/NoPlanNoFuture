import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TaskData, EditTaskModalProps } from '@/types/todoTypes';
import { updateTaskData, transformTaskFormDataBackend } from '@/lib/api/transformers';
import { useTodoMutations, useTaskFormLogic, validateEditTask, getRecurringDescription, isRecurringInstance } from './shared/';
import { TaskBasicFields, RecurringSection, DateTimeFields, ScheduleField, TaskFormData } from './shared/';

export default function EditTaskModal({ open, onOpenChange, task, onTaskUpdated }: EditTaskModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { updateTaskMutation } = useTodoMutations();

  // Helper function to get original task data for recurring instances
  const getOriginalTaskData = (task: TaskData): TaskFormData => {
    if (isRecurringInstance(task)) {
      // For recurring instances, don't use the instance_date as start_date instead, use the original task's start_date
      return {
        title: task.title || '',
        section: task.section || 'daily',
        priority: task.priority || 'low',
        description: task.description || '',
        start_date: '', // Don't inherit instance_date for recurring tasks
        end_date: task.end_date || '',
        start_time: task.start_time || '',
        end_time: task.end_time || '',
        is_recurring: task.is_recurring || false,
        recurring_days: task.recurring_days || [],
        is_schedule: task.is_schedule || false,
      };
    } else {
      // For regular tasks, use all the original data
      return {
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
      };
    }
  };

  // Use shared hook for task logic
  const {
    task: editableTask,
    setTask: setEditableTask,
    updateField,
    toggleDay,
    toggleEveryDay,
    isEveryDaySelected,
    isDaySelected,
  } = useTaskFormLogic();

  // Reset form when task changes or modal opens
  useEffect(() => {
    if (task && open) {
      const taskData = getOriginalTaskData(task);
      setEditableTask(taskData);
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
      let taskDataToUpdate: Partial<TaskData> = transformTaskFormDataBackend(editableTask);

      // If not recurring, explicitly set recurring fields to their default values
      if (!editableTask.is_recurring) {
        taskDataToUpdate = {
          ...taskDataToUpdate,
          is_recurring: false,
          recurring_days: []
        };
      }

      // Determine which task ID to update
      const taskIdToUpdate = isRecurringInstance(task) ? task.parent_task_id! : task.id;
      // Prepare updates (only send fields that actually have values)
      const updates = updateTaskData(taskDataToUpdate);

      // Use the shared mutation instead of direct API call
      await updateTaskMutation.mutateAsync({ id: taskIdToUpdate, updates });

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
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 text-sm p-3 rounded-md whitespace-pre-line">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Task Container */}
          <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 space-y-4">
            {/* Header Row with Task Label */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">Edit Task</span>
                {editableTask.is_recurring && (
                  <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                    Recurring: {getRecurringDescription(editableTask)}
                  </span>
                )}
              </div>
            </div>

            {/* Basic Task Fields */}
            <TaskBasicFields
              task={editableTask}
              updateField={updateField}
              isSubmitting={isSubmitting}
              fieldPrefix="-edit"
            />

            {/* Recurring Section */}
            <RecurringSection
              task={editableTask}
              updateField={updateField}
              isSubmitting={isSubmitting}
              fieldPrefix="-edit"
              showRecurringToggle={editableTask.section === 'none'} // Show toggle for none
              shouldShowSection={editableTask.section === 'daily' || editableTask.section === 'none'}
              toggleDay={toggleDay}
              toggleEveryDay={toggleEveryDay}
              isEveryDaySelected={isEveryDaySelected}
              isDaySelected={isDaySelected}
            />

            {/* Date and Time Fields */}
            <DateTimeFields
              task={editableTask}
              updateField={updateField}
              isSubmitting={isSubmitting}
            />

            {/* Schedule Field */}
            <ScheduleField
              task={editableTask}
              updateField={updateField}
              isSubmitting={isSubmitting}
              fieldPrefix="-edit"
              forceChecked={task.section === 'none'}
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}