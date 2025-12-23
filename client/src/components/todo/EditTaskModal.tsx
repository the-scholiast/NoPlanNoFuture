import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TaskData, EditTaskModalProps } from '@/types/todoTypes';
import { transformCreateTaskData, updateTaskData } from '@/lib/utils/transformers';
import { useTodoMutations, useTaskFormLogic, validateEditTask, getRecurringDescription, isRecurringInstance } from './shared/';
import { TaskBasicFields, RecurringSection, DateTimeFields, ScheduleField, SecondaryTaskField, TaskFormData } from './shared/components/TaskFormComponents';

export default function EditTaskModal({ open, onOpenChange, task, onTaskUpdated }: EditTaskModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<'instance' | 'series'>('instance');

  const { updateTaskMutation, deleteTaskMutation, createTaskOverrideMutation } = useTodoMutations();

  // Helper function to get original task data for recurring instances
  const getOriginalTaskData = (task: TaskData): TaskFormData => {
    if (isRecurringInstance(task)) {
      // For recurring instances, use the original task's start_date from the database
      return {
        title: task.title || '',
        section: task.section || 'daily',
        priority: task.priority || 'low',
        description: task.description || '',
        start_date: task.start_date || '', // Use the actual start_date from database
        end_date: task.end_date || '',
        start_time: task.start_time || '',
        end_time: task.end_time || '',
        is_recurring: task.is_recurring || false,
        recurring_days: task.recurring_days || [],
        is_schedule: task.is_schedule || false,
        is_secondary: task.is_secondary || false,
        count_in_stats: task.count_in_stats !== undefined ? task.count_in_stats : true,
        count_in_work_hours: task.count_in_work_hours !== undefined ? task.count_in_work_hours : true,
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
        is_secondary: task.is_secondary || false,
        count_in_stats: task.count_in_stats !== undefined ? task.count_in_stats : true,
        count_in_work_hours: task.count_in_work_hours !== undefined ? task.count_in_work_hours : true,
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
      // Default to instance mode for recurring task instances
      setEditMode(isRecurringInstance(task) ? 'instance' : 'series');
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

      if (isRecurringInstance(task) && editMode === 'instance') {
        // Create override for this specific instance
        const overrideData = {
          title: editableTask.title !== task.title ? editableTask.title : undefined,
          start_date: editableTask.start_date !== task.instance_date ? editableTask.start_date : undefined,
          end_date: editableTask.end_date !== task.end_date ? editableTask.end_date : undefined,
          start_time: editableTask.start_time !== task.start_time ? editableTask.start_time : undefined,
          end_time: editableTask.end_time !== task.end_time ? editableTask.end_time : undefined,
          description: editableTask.description !== task.description ? editableTask.description : undefined,
          priority: editableTask.priority !== task.priority ? editableTask.priority : undefined,
          is_schedule: editableTask.is_schedule !== task.is_schedule ? editableTask.is_schedule : undefined,
          is_secondary: editableTask.is_secondary !== task.is_secondary ? editableTask.is_secondary : undefined,
          count_in_stats: editableTask.count_in_stats !== task.count_in_stats ? editableTask.count_in_stats : undefined,
          count_in_work_hours: editableTask.count_in_work_hours !== task.count_in_work_hours ? editableTask.count_in_work_hours : undefined,
        };

        // Remove undefined values
        const cleanOverrideData = Object.fromEntries(
          Object.entries(overrideData).filter(([, value]) => value !== undefined)
        );

        if (Object.keys(cleanOverrideData).length > 0) {
          await createTaskOverrideMutation.mutateAsync({
            parentTaskId: task.parent_task_id!,
            instanceDate: task.instance_date!,
            overrideData: cleanOverrideData
          });
        }
      } else {

        let taskDataToUpdate: Partial<TaskData> = transformCreateTaskData(editableTask);

        if (!editableTask.is_recurring) {
          taskDataToUpdate = {
            ...taskDataToUpdate,
            is_recurring: false,
            recurring_days: []
          };
        }

        const taskIdToUpdate = isRecurringInstance(task) ? task.parent_task_id! : task.id;
        const updates = updateTaskData(taskDataToUpdate);

        await updateTaskMutation.mutateAsync({ id: taskIdToUpdate, updates });
      }

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

  // Add delete handler function
  const handleDelete = async () => {
    if (!task?.id) return;

    setError(null);
    setIsSubmitting(true);

    try {
      if (isRecurringInstance(task)) {
        // Use the edit mode to determine delete behavior
        if (editMode === 'instance') {
          // Delete this instance only - create skip override
          const confirmMessage = `Are you sure you want to delete this instance (${task.instance_date})?`;
          if (!window.confirm(confirmMessage)) return;
          
          await createTaskOverrideMutation.mutateAsync({
            parentTaskId: task.parent_task_id!,
            instanceDate: task.instance_date!,
            overrideData: { is_skipped: true }
          });
        } else {
          // Delete entire series
          const confirmMessage = 'Are you sure you want to delete the entire recurring series?';
          if (!window.confirm(confirmMessage)) return;
          
          await deleteTaskMutation.mutateAsync(task.parent_task_id!);
        }
      } else {
        // Non-recurring task deletion
        const confirmMessage = 'Are you sure you want to delete this task?';
        if (!window.confirm(confirmMessage)) return;
        
        await deleteTaskMutation.mutateAsync(task.id);
      }

      // Notify parent component
      onTaskUpdated();
      // Close modal
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting task:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!task) return null;

  const isRecurringInstanceTask = isRecurringInstance(task);

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

        {/* Edit Mode Selector for recurring instances */}
        {isRecurringInstanceTask && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
            <label className="text-sm font-medium mb-2 block">What would you like to edit?</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="editMode"
                  value="instance"
                  checked={editMode === 'instance'}
                  onChange={(e) => setEditMode(e.target.value as 'instance' | 'series')}
                  className="text-blue-600"
                />
                <span className="text-sm">Only this instance ({task.instance_date})</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="editMode"
                  value="series"
                  checked={editMode === 'series'}
                  onChange={(e) => setEditMode(e.target.value as 'instance' | 'series')}
                  className="text-blue-600"
                />
                <span className="text-sm">Entire recurring series</span>
              </label>
            </div>
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
              disabledFields={{
                title: editMode === 'instance',
                description: editMode === 'instance',
                section: editMode === 'instance',
                priority: editMode === 'instance'
              }}
            />

            {/* Recurring Section - Only show for series edit mode */}
            {editMode === 'series' && (
              <RecurringSection
                task={editableTask}
                updateField={updateField}
                isSubmitting={isSubmitting}
                fieldPrefix="-edit"
                showRecurringToggle={editableTask.section === 'none'}
                shouldShowSection={editableTask.section === 'daily' || editableTask.section === 'none'}
                toggleDay={toggleDay}
                toggleEveryDay={toggleEveryDay}
                isEveryDaySelected={isEveryDaySelected}
                isDaySelected={isDaySelected}
              />
            )}

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

            {/* Secondary Task Field */}
            <SecondaryTaskField
              task={editableTask}
              updateField={updateField}
              isSubmitting={isSubmitting}
              fieldPrefix="-edit"
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-between pt-4">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {isSubmitting ? 'Deleting...' : 'Delete Task'}
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}