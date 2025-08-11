"use client"

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AddTaskModalProps, TaskData, CreateTaskData } from '@/types/todoTypes';
import { todoApi } from '@/lib/api/todos';
import { transformCreateTaskData } from '@/lib/api/transformers';

// Import shared components and hooks
import {
  TaskBasicFields,
  RecurringSection,
  DateTimeFields,
  ScheduleField,
} from './shared/';
import { useMultiTaskFormLogic } from './shared/';
import { validateMultipleTasks } from './shared/';

export default function AddTaskModal({ open, onOpenChange, onAddTasks }: AddTaskModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use shared hook for managing multiple tasks
  const {
    tasks,
    addNewTask,
    removeTask,
    updateTask,
    getTaskHelpers,
    resetTasks
  } = useMultiTaskFormLogic();

  // Handle applying tasks
  const handleApply = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      // Use shared validation function
      const validation = validateMultipleTasks(tasks);

      if (!validation.isValid) {
        setError(validation.errors.join('\n'));
        setIsSubmitting(false);
        return;
      }

      // Filter valid tasks and transform to CreateTaskData format
      const validTasks = tasks.filter(task => task.title.trim() !== '');
      const tasksToCreate: CreateTaskData[] = validTasks.map(transformCreateTaskData);

      // Send to backend
      const createdTasks: TaskData[] = await Promise.all(
        tasksToCreate.map(taskData => todoApi.create(taskData))
      );

      // Pass the created tasks to the parent component
      onAddTasks(createdTasks);

      // Reset the modal state
      resetTasks();
      onOpenChange(false);

    } catch (error) {
      console.error('Error creating tasks:', error);
      setError(error instanceof Error ? error.message : 'Failed to create tasks. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    resetTasks();
    setError(null);
    onOpenChange(false);
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
          {tasks.map((task, index) => {
            // Get task-specific helpers
            const taskHelpers = getTaskHelpers(task.id);
            
            return (
              <div key={task.id} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 space-y-4">
                {/* Header Row with Task Label and Remove Button */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">Task {index + 1}</span>
                    {task.is_recurring && (
                      <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full">
                        Recurring: {taskHelpers.getRecurringDescription()}
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

                {/* Basic Task Fields */}
                <TaskBasicFields
                  task={task}
                  updateField={(field, value) => updateTask(task.id, field, value)}
                  isSubmitting={isSubmitting}
                  fieldPrefix={`-${task.id}`}
                />

                {/* Recurring Section - Only show for daily tasks */}
                <RecurringSection
                  task={task}
                  updateField={(field, value) => updateTask(task.id, field, value)}
                  isSubmitting={isSubmitting}
                  fieldPrefix={`-${task.id}`}
                  showRecurringToggle={false} // Hide toggle for add modal
                  shouldShowSection={task.section === 'daily'}
                  toggleDay={(day) => taskHelpers.toggleDay(day)}
                  toggleEveryDay={(checked) => taskHelpers.toggleEveryDay(checked)}
                  isEveryDaySelected={() => taskHelpers.isEveryDaySelected()}
                  isDaySelected={(day) => taskHelpers.isDaySelected(day)}
                  getRecurringDescription={() => taskHelpers.getRecurringDescription()}
                />

                {/* Date and Time Fields */}
                <DateTimeFields
                  task={task}
                  updateField={(field, value) => updateTask(task.id, field, value)}
                  isSubmitting={isSubmitting}
                  isEndDateDisabled={task.section === 'today'}
                  getMinEndDate={() => taskHelpers.getMinEndDate()}
                  handleEndDateBlur={(value) => taskHelpers.handleEndDateBlur(value)}
                />

                {/* Schedule Field */}
                <ScheduleField
                  task={task}
                  updateField={(field, value) => updateTask(task.id, field, value)}
                  isSubmitting={isSubmitting}
                  fieldPrefix={`-${task.id}`}
                />
              </div>
            );
          })}

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