"use client"

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// ===== TYPE DEFINITIONS =====
interface TaskData {
  id: string;
  task: string;
  section: 'daily' | 'today' | 'upcoming';
  priority: 'low' | 'medium' | 'high';
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  isSelected: boolean;
}

interface AddTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTasks: (tasks: TaskData[]) => void;
}

export default function AddTaskModal({ open, onOpenChange, onAddTasks }: AddTaskModalProps) {
  // ===== STATE MANAGEMENT =====
  const [tasks, setTasks] = useState<TaskData[]>([
    {
      id: '1',
      task: '',
      section: 'daily',
      priority: 'low',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      isSelected: false
    }
  ]);

  // ===== HELPER FUNCTIONS =====
  const addNewTask = () => {
    const newTask: TaskData = {
      id: Date.now().toString(),
      task: '',
      section: 'daily',
      priority: 'low',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      isSelected: false
    };
    setTasks(prev => [...prev, newTask]);
  };

  const updateTask = (id: string, field: keyof TaskData, value: any) => {
    setTasks(prev => prev.map(task =>
      task.id === id ? { ...task, [field]: value } : task
    ));
  };

  const removeTask = (id: string) => {
    if (tasks.length > 1) {
      setTasks(prev => prev.filter(task => task.id !== id));
    }
  };

  const toggleTaskSelection = (id: string) => {
    setTasks(prev => prev.map(task =>
      task.id === id ? { ...task, isSelected: !task.isSelected } : task
    ));
  };

  const handleApply = () => {
    // Only pass selected tasks to be applied
    const selectedTasks = tasks.filter(task => task.isSelected && task.task.trim() !== '');
    onAddTasks(selectedTasks);

    // Reset the modal state
    setTasks([{
      id: '1',
      task: '',
      section: 'daily',
      priority: 'low',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      isSelected: false
    }]);
    onOpenChange(false);
  };

  const handleCancel = () => {
    // Reset the modal state
    setTasks([{
      id: '1',
      task: '',
      section: 'daily',
      priority: 'low',
      startDate: '',
      endDate: '',
      startTime: '',
      endTime: '',
      isSelected: false
    }]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Tasks</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Task List */}
          {tasks.map((task, index) => (
            <div key={task.id} className="p-4 border rounded-lg bg-muted/30 space-y-4">
              {/* Header Row with Checkbox and Remove Button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Custom Checkbox */}
                  <button
                    onClick={() => toggleTaskSelection(task.id)}
                    className="flex-shrink-0"
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${task.isSelected
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground hover:border-primary'
                      }`}>
                      {task.isSelected && (
                        <div className="w-2 h-2 bg-primary-foreground rounded-sm" />
                      )}
                    </div>
                  </button>
                  <span className="text-sm font-medium">Task {index + 1}</span>
                </div>

                {/* Remove Task Button */}
                {tasks.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => removeTask(task.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Task Input */}
              <div>
                <Input
                  placeholder="Enter task name..."
                  value={task.task}
                  onChange={(e) => updateTask(task.id, 'task', e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Section and Priority Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Section</label>
                  <Select value={task.section} onValueChange={(value) => updateTask(task.id, 'section', value)}>
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
                  <Select value={task.priority} onValueChange={(value) => updateTask(task.id, 'priority', value)}>
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
                    value={task.startDate}
                    onChange={(e) => updateTask(task.id, 'startDate', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">End Date</label>
                  <Input
                    type="date"
                    value={task.endDate}
                    onChange={(e) => updateTask(task.id, 'endDate', e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Time Range Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Start Time</label>
                  <Input
                    type="time"
                    value={task.startTime}
                    onChange={(e) => updateTask(task.id, 'startTime', e.target.value)}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">End Time</label>
                  <Input
                    type="time"
                    value={task.endTime}
                    onChange={(e) => updateTask(task.id, 'endTime', e.target.value)}
                    className="w-full"
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
          >
            + Add Another Task
          </Button>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleApply}>
            Apply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}