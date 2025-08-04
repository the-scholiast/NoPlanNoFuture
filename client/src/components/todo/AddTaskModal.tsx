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
    end_time: ''
  }
  const [tasks, setTasks] = useState<InternalTaskData[]>([placeholderTask]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // HELPER FUNCTIONS
  const addNewTask = () => {
    const newTask: InternalTaskData = placeholderTask;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Tasks</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Task List */}
          {tasks.map((task, index) => (
            <div key={task.id} className="p-4 border rounded-lg bg-muted/30 space-y-4">
              {/* Header Row with Task Label and Remove Button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">Task {index + 1}</span>
                </div>

                {/* Remove Task Button */}
                {tasks.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
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