"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Settings, Trash2, Edit3, MoreVertical, Calendar, Clock } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useTodo } from '@/contexts/TodoContext';
import { todoApi } from '@/lib/api/todos';
import { TaskData } from '@/types/todoTypes';
import EditTaskModal from './EditTaskModal';
import { getTodayString } from '@/lib/utils/dateUtils';

interface TodoSection {
  title: string;
  sectionKey: 'daily' | 'today' | 'upcoming';
  tasks: TaskData[];
  showAddButton: boolean;
}

interface TodoBoardProps {
  onAddTasks?: (tasks: TaskData[]) => void;
}

export default function TodoBoard({ onAddTasks }: TodoBoardProps) {
  const { dailyTasks, todayTasks, upcomingTasks, isLoading, error, refetch } = useTodo();

  const [newTaskInputs, setNewTaskInputs] = useState<{ [key: number]: string }>({});
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskData | null>(null);

  // ===== MUTATIONS =====

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (taskData: any) => todoApi.create(taskData),
    onSuccess: () => {
      refetch();
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<TaskData> }) =>
      todoApi.update(id, updates),
    onSuccess: () => {
      refetch();
    },
  });

  // Soft delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => todoApi.delete(taskId),
    onSuccess: () => {
      refetch();
    },
  });

  // Clear completed tasks mutation (soft delete)
  const clearCompletedMutation = useMutation({
    mutationFn: (section: 'daily' | 'today' | 'upcoming') =>
      todoApi.deleteCompleted(section),
    onSuccess: () => {
      refetch();
    },
  });

  // Clear all tasks mutation (soft delete)
  const clearAllMutation = useMutation({
    mutationFn: (section: 'daily' | 'today' | 'upcoming') =>
      todoApi.deleteAll(section),
    onSuccess: () => {
      refetch();
    },
  });

  // ===== ORGANIZE TASKS BY SECTION =====
  const sections: TodoSection[] = [
    {
      title: "Daily",
      sectionKey: 'daily',
      tasks: dailyTasks,
      showAddButton: false
    },
    {
      title: "Today",
      sectionKey: 'today',
      tasks: todayTasks,
      showAddButton: false
    },
    {
      title: "Upcoming",
      sectionKey: 'upcoming',
      tasks: upcomingTasks,
      showAddButton: false
    }
  ];

  // ===== HELPER FUNCTIONS =====
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      // Parse date string directly to avoid timezone conversion issues
      // dateString is expected to be in YYYY-MM-DD format
      const [year, month, day] = dateString.split('-').map(Number);
      if (!year || !month || !day) return dateString;

      // Create date object using local timezone to avoid UTC conversion
      const date = new Date(year, month - 1, day);
      const currentYear = new Date().getFullYear();

      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== currentYear ? 'numeric' : undefined
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return null;
    try {
      // Handle time format (HH:MM or HH:MM:SS)
      const [hours, minutes] = timeString.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeString;
    }
  };

  const getDateRangeDisplay = (task: TaskData) => {
    const startDate = formatDate(task.start_date);
    const endDate = formatDate(task.end_date);

    if (!startDate && !endDate) return null;

    if (startDate && endDate && startDate !== endDate) {
      return `${startDate} - ${endDate}`;
    }

    return startDate || endDate;
  };

  const getTimeRangeDisplay = (task: TaskData) => {
    const startTime = formatTime(task.start_time);
    const endTime = formatTime(task.end_time);

    if (!startTime && !endTime) return null;

    if (startTime && endTime) {
      return `${startTime} - ${endTime}`;
    }

    return startTime || endTime;
  };

  // ===== TASK MANAGEMENT FUNCTIONS =====
  const handleAddTasks = (newTasks: TaskData[]) => {
    refetch();
    if (onAddTasks) {
      onAddTasks(newTasks);
    }
  };

  const addTask = (sectionIndex: number) => {
    const taskTitle = newTaskInputs[sectionIndex] || "";
    if (taskTitle.trim() === "") return;

    const section = sections[sectionIndex];

    let taskData = {
      title: taskTitle.trim(),
      section: section.sectionKey,
      // Add date logic for dynamic sections
      ...(section.sectionKey === 'today' && {
        start_date: new Date().toISOString().split('T')[0]
      }),
      ...(section.sectionKey === 'upcoming' && {
        start_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      })
    };

    createTaskMutation.mutate(taskData);
    setNewTaskInputs(prev => ({ ...prev, [sectionIndex]: "" }));
  };

  const toggleTask = (taskId: string) => {
    const allTasks = [...dailyTasks, ...todayTasks, ...upcomingTasks];
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;

    const today = getTodayString(); // Use existing utility function
    const isDailyTask = task.section === 'daily';

    if (!task.completed) {
      // Completing a task
      const baseUpdates: Partial<TaskData> = {
        completed: true,
        completed_at: today, // Consistent date format for all tasks
      };

      if (isDailyTask) {
        // Additional updates for daily tasks
        const dailyUpdates = {
          ...baseUpdates,
          completion_count: (task.completion_count || 0) + 1,
          last_completed_date: today
        };
        updateTaskMutation.mutate({ id: taskId, updates: dailyUpdates });
      } else {
        // Regular tasks use base updates only
        updateTaskMutation.mutate({ id: taskId, updates: baseUpdates });
      }
    } else {
      // Uncompleting a task
      const baseUpdates: Partial<TaskData> = {
        completed: false,
        completed_at: undefined,
      };

      if (isDailyTask) {
        // Additional updates for daily tasks
        const dailyUpdates = {
          ...baseUpdates,
          completion_count: Math.max((task.completion_count || 1) - 1, 0),
          last_completed_date: (task.completion_count || 1) <= 1 ? undefined : task.last_completed_date
        };
        updateTaskMutation.mutate({ id: taskId, updates: dailyUpdates });
      } else {
        // Regular tasks use base updates only
        updateTaskMutation.mutate({ id: taskId, updates: baseUpdates });
      }
    }
  };

  const clearCompleted = (sectionIndex: number) => {
    const section = sections[sectionIndex];
    clearCompletedMutation.mutate(section.sectionKey);
  };

  const clearAll = (sectionIndex: number) => {
    const section = sections[sectionIndex];
    clearAllMutation.mutate(section.sectionKey);
  };

  const deleteTask = (taskId: string) => {
    deleteTaskMutation.mutate(taskId);
  };

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTask(expandedTask === taskId ? null : taskId);
  };

  const openEditModal = (task: TaskData) => {
    setTaskToEdit(task);
    setEditModalOpen(true);
  };

  const handleTaskUpdated = () => {
    refetch();
  };

  const handleInputKeyPress = (e: React.KeyboardEvent, sectionIndex: number) => {
    if (e.key === 'Enter') {
      addTask(sectionIndex);
    }
  };

  // ===== RENDER =====
  if (isLoading) {
    return (
      <div className="w-full h-full p-6 bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading tasks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full p-6 bg-background flex items-center justify-center">
        <div className="text-destructive">
          Error loading tasks: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full h-full p-6 bg-background">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
          {sections.map((section, sectionIndex) => (
            <Card key={section.title} className="flex flex-col h-fit min-h-[400px]">
              <CardHeader className="pb-4 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">
                    {section.title}
                    <span className="ml-2 text-sm text-muted-foreground">
                      ({section.tasks.length})
                    </span>
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => clearCompleted(sectionIndex)}
                        disabled={clearCompletedMutation.isPending}
                      >
                        Move completed to trash
                      </DropdownMenuItem>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            Move all to trash
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Move all tasks to trash?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will move all tasks in the {section.title.toLowerCase()} section to trash.
                              You can restore them later if needed.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => clearAll(sectionIndex)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Move to Trash
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="flex-1">
                {/* Task List */}
                <div className="space-y-2 mb-4">
                  {section.tasks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">
                        {section.sectionKey === 'today'
                          ? 'No tasks scheduled for today'
                          : section.sectionKey === 'upcoming'
                            ? 'No upcoming tasks'
                            : 'No daily tasks'
                        }
                      </p>
                    </div>
                  ) : (
                    section.tasks.map((task) => {
                      const dateRange = getDateRangeDisplay(task);
                      const timeRange = getTimeRangeDisplay(task);

                      return (
                        <div
                          key={task.id}
                          className="group flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                        >
                          {/* Checkbox */}
                          <button
                            onClick={() => toggleTask(task.id)}
                            disabled={updateTaskMutation.isPending}
                            className="flex-shrink-0"
                          >
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${task.completed
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
                            <div className="space-y-1">
                              <div
                                className={`text-sm font-medium cursor-pointer ${task.completed ? 'line-through text-muted-foreground' : ''
                                  }`}
                                onClick={() => toggleTaskExpansion(task.id)}
                              >
                                {task.title}
                              </div>

                              {/* Date and Time Display */}
                              {(dateRange || timeRange) && (
                                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                  {dateRange && (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      <span>{dateRange}</span>
                                    </div>
                                  )}
                                  {timeRange && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      <span>{timeRange}</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Task Description - Shows when expanded */}
                              {expandedTask === task.id && task.description && (
                                <div className="text-xs text-muted-foreground mt-1 p-2 bg-muted/30 rounded break-words overflow-hidden">
                                  {task.description}
                                </div>
                              )}

                              {/* Priority Badge */}
                              {task.priority && (
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${task.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                                      task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                                        'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                    }`}>
                                    {task.priority}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditModal(task)}>
                                <Edit3 className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => deleteTask(task.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Move to Trash
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Add Task Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder={`Add ${section.title.toLowerCase()} task...`}
                    value={newTaskInputs[sectionIndex] || ""}
                    onChange={(e) => setNewTaskInputs(prev => ({ ...prev, [sectionIndex]: e.target.value }))}
                    onKeyPress={(e) => handleInputKeyPress(e, sectionIndex)}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => addTask(sectionIndex)}
                    disabled={createTaskMutation.isPending || !newTaskInputs[sectionIndex]?.trim()}
                    size="sm"
                  >
                    Add
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Edit Task Modal */}
      <EditTaskModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        task={taskToEdit}
        onTaskUpdated={handleTaskUpdated}
      />
    </>
  );
}