"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TaskData } from '@/types/todoTypes';
import { todoApi } from '@/lib/api/todos';
import { CreateTaskData, EditTaskModalProps } from '@/types/todoTypes';
import { updateTaskData } from '@/lib/api/transformers';

interface EditableTaskData extends CreateTaskData {};

export default function EditTaskModal({ open, onOpenChange, task, onTaskUpdated }: EditTaskModalProps) {
  const [editableTask, setEditableTask] = useState<EditableTaskData>({
    title: '',
    section: 'daily',
    priority: 'low',
    description: '',
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: ''
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
        end_time: task.end_time || ''
      });
      setError(null);
    }
  }, [task, open]);

  // HELPER FUNCTIONS
  const updateField = (field: keyof EditableTaskData, value: any) => {
    setEditableTask(prev => ({ ...prev, [field]: value }));
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

      // Prepare updates (only send fields that actually have values)
      const updates: Partial<TaskData> = updateTaskData(editableTask);

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
          <DialogTitle>Edit Task</DialogTitle>
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