"use client"

import React, { useState } from 'react';
import { Settings, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// ===== TYPE DEFINITIONS =====
interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  dueDate?: Date;
  priority?: 'low' | 'medium' | 'high';
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
}

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

interface TodoSection {
  title: string;
  tasks: Task[];
  showAddButton: boolean;
}

interface TodoBoardProps {
  onAddTasks?: (tasks: TaskData[]) => void;
}

export default function TodoBoard({ onAddTasks }: TodoBoardProps) {
  // ===== STATE MANAGEMENT =====
  const [sections, setSections] = useState<TodoSection[]>([
    {
      title: "Daily",
      tasks: [
        { id: '1', title: 'Task', completed: false, createdAt: new Date() }
      ],
      showAddButton: false
    },
    {
      title: "Today", 
      tasks: [],
      showAddButton: false
    },
    {
      title: "Upcoming",
      tasks: [],
      showAddButton: false
    }
  ]);

  const [newTaskInputs, setNewTaskInputs] = useState<{[key: string]: string}>({});
  const [editingTask, setEditingTask] = useState<{sectionIndex: number, taskId: string} | null>(null);
  const [editTaskValue, setEditTaskValue] = useState("");

  // ===== TASK MANAGEMENT FUNCTIONS =====
  const handleAddTasks = (newTasks: TaskData[]) => {
    newTasks.forEach(taskData => {
      // Map the section name to section index
      let targetSectionIndex = 0;
      switch (taskData.section) {
        case 'daily':
          targetSectionIndex = 0;
          break;
        case 'today':
          targetSectionIndex = 1;
          break;
        case 'upcoming':
          targetSectionIndex = 2;
          break;
      }

      // Create the new task object
      const newTask: Task = {
        id: Date.now().toString() + Math.random(), // Ensure unique ID
        title: taskData.task,
        completed: false,
        createdAt: new Date(),
        priority: taskData.priority,
        startDate: taskData.startDate,
        endDate: taskData.endDate,
        startTime: taskData.startTime,
        endTime: taskData.endTime,
      };

      // Add the task to the appropriate section
      setSections(prev => prev.map((section, index) => 
        index === targetSectionIndex 
          ? { ...section, tasks: [...section.tasks, newTask] }
          : section
      ));
    });
  };

  const addTask = (sectionIndex: number) => {
    const taskTitle = newTaskInputs[sectionIndex] || "";
    if (taskTitle.trim() === "") return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: taskTitle.trim(),
      completed: false,
      createdAt: new Date(),
    };

    setSections(prev => prev.map((section, index) => 
      index === sectionIndex 
        ? { ...section, tasks: [...section.tasks, newTask] }
        : section
    ));

    // Clear input
    setNewTaskInputs(prev => ({ ...prev, [sectionIndex]: "" }));
  };

  const toggleTask = (sectionIndex: number, taskId: string) => {
    setSections(prev => prev.map((section, index) => 
      index === sectionIndex 
        ? { 
            ...section, 
            tasks: section.tasks.map(task => 
              task.id === taskId ? { ...task, completed: !task.completed } : task
            )
          }
        : section
    ));
  };

  const clearCompleted = (sectionIndex: number) => {
    setSections(prev => prev.map((section, index) => 
      index === sectionIndex 
        ? { ...section, tasks: section.tasks.filter(task => !task.completed) }
        : section
    ));
  };

  const clearAll = (sectionIndex: number) => {
    setSections(prev => prev.map((section, index) => 
      index === sectionIndex 
        ? { ...section, tasks: [] }
        : section
    ));
  };

  const deleteTask = (sectionIndex: number, taskId: string) => {
    setSections(prev => prev.map((section, index) => 
      index === sectionIndex 
        ? { ...section, tasks: section.tasks.filter(task => task.id !== taskId) }
        : section
    ));
  };

  const startEditingTask = (sectionIndex: number, taskId: string) => {
    const task = sections[sectionIndex].tasks.find(t => t.id === taskId);
    if (task) {
      setEditingTask({ sectionIndex, taskId });
      setEditTaskValue(task.title);
    }
  };

  const saveEditedTask = () => {
    if (!editingTask) return;
    
    setSections(prev => prev.map((section, index) => 
      index === editingTask.sectionIndex 
        ? { 
            ...section, 
            tasks: section.tasks.map(task => 
              task.id === editingTask.taskId 
                ? { ...task, title: editTaskValue.trim() }
                : task
            )
          }
        : section
    ));

    setEditingTask(null);
    setEditTaskValue("");
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setEditTaskValue("");
  };

  const handleInputKeyPress = (e: React.KeyboardEvent, sectionIndex: number) => {
    if (e.key === 'Enter') {
      addTask(sectionIndex);
    }
  };

  const handleEditKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEditedTask();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  return (
    <div className="w-full h-full p-6 bg-background">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
        {sections.map((section, sectionIndex) => (
          <Card key={section.title} className="flex flex-col h-fit min-h-[400px]">
            <CardHeader className="pb-4 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">
                  {section.title}
                </CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => clearCompleted(sectionIndex)}>
                      Clear completed
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => clearAll(sectionIndex)}>
                      Clear all
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent className="flex-1">
              {/* Task List */}
              <div className="space-y-2 mb-4">
                {section.tasks.map((task) => (
                  <div 
                    key={task.id} 
                    className="group flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleTask(sectionIndex, task.id)}
                      className="flex-shrink-0"
                    >
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                        task.completed 
                          ? 'bg-primary border-primary' 
                          : 'border-muted-foreground hover:border-primary'
                      }`}>
                        {task.completed && (
                          <div className="w-2 h-2 bg-primary-foreground rounded-sm" />
                        )}
                      </div>
                    </button>

                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                      {editingTask?.sectionIndex === sectionIndex && editingTask?.taskId === task.id ? (
                        <Input
                          value={editTaskValue}
                          onChange={(e) => setEditTaskValue(e.target.value)}
                          onKeyDown={handleEditKeyPress}
                          onBlur={saveEditedTask}
                          className="h-8 text-sm"
                          autoFocus
                        />
                      ) : (
                        <div className="space-y-1">
                          <div 
                            className={`text-sm font-medium cursor-pointer ${
                              task.completed ? 'line-through text-muted-foreground' : ''
                            }`}
                            onClick={() => startEditingTask(sectionIndex, task.id)}
                          >
                            {task.title}
                          </div>
                          
                          {/* Priority Badge */}
                          {task.priority && (
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                task.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                                task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                                'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                              }`}>
                                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                              </span>
                            </div>
                          )}

                          {/* Date and Time Information */}
                          {(task.startDate || task.endDate || task.startTime || task.endTime) && (
                            <div className="space-y-1">
                              {/* Dates */}
                              {(task.startDate || task.endDate) && (
                                <div className="text-xs text-muted-foreground">
                                  📅 {task.startDate && new Date(task.startDate).toLocaleDateString()}
                                  {task.startDate && task.endDate && ' - '}
                                  {task.endDate && task.endDate !== task.startDate && new Date(task.endDate).toLocaleDateString()}
                                </div>
                              )}

                              {/* Times */}
                              {(task.startTime || task.endTime) && (
                                <div className="text-xs text-muted-foreground">
                                  🕐 {task.startTime}
                                  {task.startTime && task.endTime && ' - '}
                                  {task.endTime}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Task Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={() => startEditingTask(sectionIndex, task.id)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteTask(sectionIndex, task.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Task Input */}
              {/* Removed - using only global modal button */}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}