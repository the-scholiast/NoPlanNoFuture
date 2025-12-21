"use client"

import { useEffect, useState, useMemo } from 'react';
import { X, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { convertTimeSlotTo24Hour, SLOT_MINUTES } from '@/components/calendar/timetable/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AddTaskModalProps, TaskData, CreateTaskData } from '@/types/todoTypes';
import { transformCreateTaskData } from '@/lib/utils/transformers';
import { TaskBasicFields, RecurringSection, DateTimeFields, ScheduleField } from '../shared/components/TaskFormComponents';
import { useMultiTaskFormLogic, validateMultipleTasks, useTodoMutations, getRecurringDescription } from '../shared/';
import { useQuery } from '@tanstack/react-query';
import { todoApi } from '@/lib/api/todos';
import { todoKeys } from '@/lib/queryKeys';

export default function AddTaskModal({ open, onOpenChange, onAddTasks, preFilledData }: AddTaskModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    tasks,
    addNewTask,
    removeTask,
    updateTask,
    copyTask,
    getTaskHelpers,
    resetTasks,
    initializeWithData
  } = useMultiTaskFormLogic();
  const { createTaskMutation } = useTodoMutations();

  // Fetch all existing tasks to get task names for suggestions
  const { data: allTasks = [] } = useQuery({
    queryKey: todoKeys.all,
    queryFn: todoApi.getAll,
    enabled: open, // Only fetch when modal is open
  });

  // Extract unique task names with their closest dates
  const existingTaskNamesWithDates = useMemo(() => {
    const taskMap = new Map<string, { name: string; closestDate: Date }>();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    allTasks.forEach(task => {
      if (task.title?.trim()) {
        const name = task.title.trim();
        // Use instance_date for recurring tasks, otherwise start_date
        const taskDateStr = task.instance_date || task.start_date;
        const taskDate = taskDateStr ? new Date(taskDateStr) : null;
        
        if (taskDate) {
          taskDate.setHours(0, 0, 0, 0);
          const existing = taskMap.get(name);
          
          if (!existing) {
            taskMap.set(name, { name, closestDate: taskDate });
          } else {
            // Keep the date closest to today
            const existingDiff = Math.abs(existing.closestDate.getTime() - today.getTime());
            const currentDiff = Math.abs(taskDate.getTime() - today.getTime());
            
            if (currentDiff < existingDiff) {
              taskMap.set(name, { name, closestDate: taskDate });
            }
          }
        } else if (!taskMap.has(name)) {
          // If no date, use a far future date so they appear last
          taskMap.set(name, { name, closestDate: new Date('9999-12-31') });
        }
      }
    });

    // Sort by closest date (closest to today first)
    return Array.from(taskMap.values())
      .sort((a, b) => {
        const diffA = Math.abs(a.closestDate.getTime() - today.getTime());
        const diffB = Math.abs(b.closestDate.getTime() - today.getTime());
        return diffA - diffB;
      });
  }, [allTasks]);

  // Extract just the names for backward compatibility
  const existingTaskNames = useMemo(() => {
    return existingTaskNamesWithDates.map(item => item.name);
  }, [existingTaskNamesWithDates]);

  // Add helper function to calculate end time (15 minutes later, based on SLOT_MINUTES)
  const calculateEndTime = (startTime: string): string => {
    const startTime24 = convertTimeSlotTo24Hour(startTime);
    const [hours, minutes] = startTime24.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + SLOT_MINUTES;

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

  // Initialize task form data
  useEffect(() => {
    if (!open) return;

    if (preFilledData) {
      // Initialize with pre-filled data when modal opens with data
      const initialTaskData = {
        title: '',
        section: 'none' as const,
        priority: 'low' as const,
        description: '',
        start_date: preFilledData.selectedDate || '',
        end_date: '',
        start_time: preFilledData.selectedTime ? convertTimeSlotTo24Hour(preFilledData.selectedTime) : '',
        end_time: preFilledData.selectedTime ? calculateEndTime(preFilledData.selectedTime) : '',
        is_recurring: false,
        recurring_days: [],
        is_schedule: true,
      };
      initializeWithData(initialTaskData);
    } else {
      // Reset when opening without pre-filled data
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
                        Recurring: {getRecurringDescription(task)}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1">
                    {/* Copy Task Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyTask(task.id)}
                      disabled={isSubmitting}
                      className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      title="Copy this task"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>

                    {/* Remove Task Button */}
                    {tasks.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTask(task.id)}
                        disabled={isSubmitting}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                        title="Remove this task"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Basic Task Fields */}
                <TaskBasicFields
                  task={task}
                  updateField={(field, value) => updateTask(task.id, field, value)}
                  isSubmitting={isSubmitting}
                  fieldPrefix={`-${task.id}`}
                  existingTaskNames={existingTaskNames}
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
                />

                {/* Date and Time Fields */}
                <DateTimeFields
                  task={task}
                  updateField={(field, value) => updateTask(task.id, field, value)}
                  isSubmitting={isSubmitting}
                  isEndDateDisabled={task.section === 'today' || (task.section === 'none' && !task.is_recurring) || task.section === 'upcoming'}
                  getMinEndDate={() => taskHelpers.getMinEndDate()}
                  handleEndDateBlur={(value) => taskHelpers.handleEndDateBlur(value)}
                />

                {/* Schedule Field */}
                <ScheduleField
                  task={task}
                  updateField={(field, value) => updateTask(task.id, field, value)}
                  isSubmitting={isSubmitting}
                  fieldPrefix={`-${task.id}`}
                  forceChecked={task.section === 'none'}
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