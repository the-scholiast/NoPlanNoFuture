"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Settings, Trash2, Edit3, MoreVertical, Calendar, Clock, Repeat, AlertCircle, BarChart3, RefreshCw } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useTodo } from '@/contexts/TodoContext';
import { todoApi } from '@/lib/api/todos';
import { recurringTodoApi } from '@/lib/api/recurringTodosApi';
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
  // Updated to use new recurring tasks data from context
  const {
    dailyTasks,
    todayTasksWithRecurring,
    upcomingTasksWithRecurring,
    isLoading,
    isLoadingTodayRecurring,
    isLoadingUpcomingRecurring,
    error,
    refetch,
    refetchTodayRecurring,
    refetchUpcomingRecurring
  } = useTodo();

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
      // Refetch recurring tasks for Today and Upcoming sections
      refetchTodayRecurring();
      refetchUpcomingRecurring();
    },
  });

  // Update task mutation - Enhanced for recurring tasks
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<TaskData> }) => {
      // Extract the original task ID for recurring task instances
      const originalTaskId = id.includes('_') ? id.split('_')[0] : id;
      return todoApi.update(originalTaskId, updates);
    },
    onSuccess: () => {
      refetch();
      refetchTodayRecurring();
      refetchUpcomingRecurring();
    },
  });

  // Soft delete task mutation - Enhanced for recurring tasks
  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => {
      // Extract the original task ID for recurring task instances
      const originalTaskId = taskId.includes('_') ? taskId.split('_')[0] : taskId;
      return todoApi.delete(originalTaskId);
    },
    onSuccess: () => {
      refetch();
      refetchTodayRecurring();
      refetchUpcomingRecurring();
    },
  });

  // Clear completed tasks mutation (soft delete)
  const clearCompletedMutation = useMutation({
    mutationFn: (sectionKey: 'daily' | 'today' | 'upcoming') =>
      todoApi.deleteCompleted(sectionKey),
    onSuccess: (data, sectionKey) => {
      refetch();
      if (sectionKey === 'today') refetchTodayRecurring();
      if (sectionKey === 'upcoming') refetchUpcomingRecurring();
    },
  });

  // Clear all tasks mutation (soft delete)
  const clearAllMutation = useMutation({
    mutationFn: (sectionKey: 'daily' | 'today' | 'upcoming') =>
      todoApi.deleteAll(sectionKey),
    onSuccess: (data, sectionKey) => {
      refetch();
      if (sectionKey === 'today') refetchTodayRecurring();
      if (sectionKey === 'upcoming') refetchUpcomingRecurring();
    },
  });

  // ===== ORGANIZE TASKS BY SECTION =====
  // Updated to use recurring tasks data for Today and Upcoming sections
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
      // Filter out daily tasks from today's recurring instances to avoid duplication
      tasks: todayTasksWithRecurring.filter(task => task.section !== 'daily'),
      showAddButton: false
    },
    {
      title: "Upcoming",
      sectionKey: 'upcoming',
      // Filter out daily tasks from upcoming recurring instances to avoid duplication
      tasks: upcomingTasksWithRecurring.filter(task => task.section !== 'daily'),
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

  // New helper function to check if task is a recurring instance
  const isRecurringInstance = (task: TaskData) => {
    return task.id.includes('_') && task.parent_task_id;
  };

  // New helper function to get recurring pattern display using recurringTodoApi
  const getRecurringPatternDisplay = (task: TaskData) => {
    // Use the API helper for better formatting
    return recurringTodoApi.getRecurringDescription(task);
  };

  // ===== TASK MANAGEMENT FUNCTIONS =====
  const handleAddTasks = (newTasks: TaskData[]) => {
    refetch();
    refetchTodayRecurring();
    refetchUpcomingRecurring();
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

  // Updated toggle task function to handle recurring task instances
  const toggleTask = (taskId: string) => {
    // Find the task in all sections (including recurring instances)
    const allTasks = [...dailyTasks, ...todayTasksWithRecurring, ...upcomingTasksWithRecurring];
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;

    const today = getTodayString();
    const isDailyTask = task.section === 'daily';
    const isRecurringTask = task.is_recurring || isRecurringInstance(task);

    if (!task.completed) {
      // Completing a task
      const baseUpdates: Partial<TaskData> = {
        completed: true,
        completed_at: today,
      };

      if (isDailyTask) {
        // Additional updates for daily tasks
        const dailyUpdates = {
          ...baseUpdates,
          completion_count: (task.completion_count || 0) + 1,
          last_completed_date: today
        };
        updateTaskMutation.mutate({ id: taskId, updates: dailyUpdates });
      } else if (isRecurringTask && isRecurringInstance(task)) {
        // For recurring task instances, we only update completion status
        // The completion is tracked for this specific instance/date
        updateTaskMutation.mutate({ id: taskId, updates: baseUpdates });
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
        // Regular tasks and recurring instances use base updates only
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
    // For recurring task instances, we pass the original task data
    // but keep the instance ID for reference
    if (isRecurringInstance(task)) {
      // Create a modified task object for editing the parent task
      const editTask = {
        ...task,
        // We'll edit the parent task, not the instance
        id: task.parent_task_id || task.id.split('_')[0]
      };
      setTaskToEdit(editTask);
    } else {
      setTaskToEdit(task);
    }
    setEditModalOpen(true);
  };

  const handleTaskUpdated = () => {
    refetch();
    refetchTodayRecurring();
    refetchUpcomingRecurring();
  };

  const handleInputKeyPress = (e: React.KeyboardEvent, sectionIndex: number) => {
    if (e.key === 'Enter') {
      addTask(sectionIndex);
    }
  };

  // ===== RENDER =====
  // Updated loading logic to account for recurring tasks
  const isAnyLoading = isLoading || isLoadingTodayRecurring || isLoadingUpcomingRecurring;

  if (isAnyLoading) {
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
                      const recurringPattern = getRecurringPatternDisplay(task);
                      const isInstance = isRecurringInstance(task);

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
                                className={`text-sm font-medium cursor-pointer flex items-center gap-2 ${task.completed ? 'line-through text-muted-foreground' : ''
                                  }`}
                                onClick={() => toggleTaskExpansion(task.id)}
                              >
                                <span>{task.title}</span>
                                {/* Recurring task indicator */}
                                {(task.is_recurring || isInstance) && (
                                  <div title="Recurring task">
                                    <Repeat className="h-3 w-3 text-blue-500" />
                                  </div>
                                )}
                                {/* Recurring instance indicator */}
                                {isInstance && (
                                  <div title="Task instance">
                                    <AlertCircle className="h-3 w-3 text-orange-500" />
                                  </div>
                                )}
                              </div>

                              {/* Date, Time, and Recurring Pattern Display */}
                              {(dateRange || timeRange || recurringPattern) && (
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
                                  {recurringPattern && (
                                    <div className="flex items-center gap-1">
                                      <Repeat className="h-3 w-3" />
                                      <span>{recurringPattern}</span>
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

                              {/* Recurring Instance Info */}
                              {isInstance && (
                                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                  Instance for {formatDate(task.start_date)}
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
                                {isInstance ? 'Edit Pattern' : 'Edit'}
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => deleteTask(task.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {isInstance ? 'Remove Pattern' : 'Move to Trash'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      );
                    })
                  )}
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