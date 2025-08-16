"use client"

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AddTaskModalProps, TaskData, CreateTaskData } from '@/types/todoTypes';
import { transformCreateTaskData } from '@/lib/api/transformers';
import { TaskBasicFields, RecurringSection, DateTimeFields, ScheduleField, TaskFormData, } from '../shared/';
import { useMultiTaskFormLogic, validateMultipleTasks, useTodoMutations } from '../shared/';

export default function AddTaskModal({ open, onOpenChange, onAddTasks, preFilledData }: AddTaskModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use shared hook for managing multiple tasks
  const {
    tasks,
    addNewTask,
    removeTask,
    updateTask,
    getTaskHelpers,
    resetTasks,
    initializeWithData
  } = useMultiTaskFormLogic();

  const { createTaskMutation } = useTodoMutations();

  // Add helper function to convert time slot format
  const convertTimeSlotTo24Hour = (timeSlot: string): string => {
    const [time, period] = timeSlot.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (period === 'AM' && hours === 12) hours = 0;
    if (period === 'PM' && hours !== 12) hours += 12;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Add helper function to calculate end time (30 minutes later)
  const calculateEndTime = (startTime: string): string => {
    const startTime24 = convertTimeSlotTo24Hour(startTime);
    const [hours, minutes] = startTime24.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + 30;

    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;

    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  };

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

      // Use the shared mutation instead of direct API calls
      const createdTasks: TaskData[] = await Promise.all(
        tasksToCreate.map(taskData => createTaskMutation.mutateAsync(taskData))
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

  useEffect(() => {
    if (open && preFilledData) {
      // Create initial task with pre-filled data
      const initialTaskData = {
        title: '',
        section: 'none' as const,
        priority: 'low' as const,
        description: '',
        start_date: preFilledData.selectedDate || '',
        end_date: preFilledData.selectedDate || '',
        start_time: preFilledData.selectedTime ? convertTimeSlotTo24Hour(preFilledData.selectedTime) : '',
        end_time: preFilledData.selectedTime ? calculateEndTime(preFilledData.selectedTime) : '',
        is_recurring: false,
        recurring_days: [],
        is_schedule: true, // Set to true since we're setting specific times
      };

      // Initialize the first task with pre-filled data
      initializeWithData(initialTaskData);
    } else if (open && !preFilledData) {
      // Reset to default when opening without pre-filled data
      resetTasks();
    }
  }, [open, preFilledData, initializeWithData, resetTasks]);

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
                  showRecurringToggle={task.section === 'none'} // Show toggle for none
                  shouldShowSection={task.section === 'daily' || task.section === 'none'}
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