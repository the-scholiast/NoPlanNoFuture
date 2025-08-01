"use client"

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TaskData, AddTaskModalProps, CreateTaskData, InternalTaskData } from '@/types/todoTypes';
import { apiCall } from '@/lib/api';

export default function AddTaskModal({ open, onOpenChange, onAddTasks }: AddTaskModalProps) {
  // ===== STATE MANAGEMENT =====
  const [tasks, setTasks] = useState<InternalTaskData[]>([
    {
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
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // HELPER FUNCTIONS
  const addNewTask = () => {
    const newTask: InternalTaskData = {
      id: "temp",
      title: '',
      section: 'daily',
      priority: 'low',
      description: '',
      start_date: '',
      end_date: '',
      start_time: '',
      end_time: ''
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

  // API FUNCTIONS
  const createTaskInBackend = async (taskData: CreateTaskData) => {
    try {
      const response = await apiCall('/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData)
      });
      return response;
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  }

  const createMultipleTasksInBackend = async (tasksData: CreateTaskData[]) => {
    try {
      const createdTasks = await Promise.all(
        tasksData.map(taskData => createTaskInBackend(taskData))
      );
      return createdTasks;
    } catch (error) {
      console.error('Failed to create multiple tasks:', error);
      throw error;
    }
  }

  const handleApply = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      // Filter tasks with valid task names (no need to check isSelected anymore)
      const validTasks = tasks.filter(task => task.title.trim() !== '');

      if (validTasks.length === 0) {
        setError('Please add at least one task with a valid name.');
        setIsSubmitting(false);
        return;
      }

      // Transform tasks to the format expected by the backend
      const tasksToCreate: CreateTaskData[] = validTasks.map(task => ({
        title: task.title.trim(),
        section: task.section,
        priority: task.priority,
        description: task.description?.trim() || undefined,
        start_date: task.start_date || undefined,
        end_date: task.end_date || undefined,
        start_time: task.start_time || undefined,
        end_time: task.end_time || undefined,
      }));

      // Send to backend
      const createdTasks = await createMultipleTasksInBackend(tasksToCreate);

      // Convert backend response to TaskData format for the parent component
      const taskDataArray: TaskData[] = createdTasks.map(backendTask => ({
        id: backendTask.id,
        title: backendTask.title,
        completed: false,
        created_at: backendTask.created_at || new Date().toISOString(),
        section: backendTask.section,
        priority: backendTask.priority,
        description: backendTask.description,
        start_date: backendTask.start_date,
        end_date: backendTask.end_date,
        start_time: backendTask.start_time,
        end_time: backendTask.end_time
      }));

      // Pass the created tasks to the parent component
      onAddTasks(taskDataArray);

      // Reset the modal state
      setTasks([{
        id: '1',
        title: '',
        section: 'daily',
        priority: 'low',
        description: '',
        start_date: '',
        end_date: '',
        start_time: '',
        end_time: ''
      }]);

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
    setTasks([{
      id: '1',
      title: '',
      section: 'daily',
      priority: 'low',
      description: '',
      start_date: '',
      end_date: '',
      start_time: '',
      end_time: ''
    }]);
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