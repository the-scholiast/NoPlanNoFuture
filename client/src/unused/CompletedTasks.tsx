'use client'

import React, { useState, useMemo } from 'react';
import { Check, Trash2, RotateCcw, Calendar, Clock, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TaskData } from '@/types/todoTypes';
import { todoApi } from '@/lib/api/todos';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTodo } from '@/unused/TodoContext';
import { CompactTaskSorting } from '@/components/todo/shared/components/TaskSortingComponent';

interface CompletedTasksProps {
  className?: string;
}

export default function CompletedTasks({ className }: CompletedTasksProps) {
  const queryClient = useQueryClient();
  const { allTasks, isLoading, error } = useTodo();
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [isTasksExpanded, setIsTasksExpanded] = useState(false); // New state for collapsible container
  const [sortedCompletedTasks, setSortedCompletedTasks] = useState<TaskData[]>([]); // State for sorted tasks

  // Date filter state - default to current week
  // Get current date in local timezone to avoid UTC offset issues
  const today = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Get current week (Monday to Sunday)
  const currentWeek = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday to 6, others to dayOfWeek - 1

    const monday = new Date(now);
    monday.setDate(now.getDate() - daysFromMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return {
      start: formatDate(monday),
      end: formatDate(sunday)
    };
  }, []);

  // Get current month
  const currentMonth = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return {
      start: formatDate(firstDay),
      end: formatDate(lastDay)
    };
  }, []);

  const [dateFilter, setDateFilter] = useState({
    startDate: currentWeek.start,
    endDate: currentWeek.end,
    enabled: true
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Get completed tasks from context
  const allCompletedTasks = useMemo(() => {
    return allTasks.filter(task => task.completed);
  }, [allTasks]);

  // Apply date filter to completed tasks
  const filteredCompletedTasks = useMemo(() => {
    if (!dateFilter.enabled) {
      return allCompletedTasks;
    }

    return allCompletedTasks.filter(task => {
      const completedDate = task.completed_at || task.created_at;
      if (!completedDate) return false;

      let taskDateStr: string;

      if (completedDate.includes('T') || completedDate.includes(' ')) {
        // Extract just the date part to avoid timezone conversion
        taskDateStr = completedDate.split('T')[0] || completedDate.split(' ')[0];
      } else {
        // It's already just a date string
        taskDateStr = completedDate;
      }

      return taskDateStr >= dateFilter.startDate && taskDateStr <= dateFilter.endDate;
    });
  }, [allCompletedTasks, dateFilter]);

  // Use sorted tasks if available, otherwise use filtered tasks
  const displayTasks = sortedCompletedTasks.length > 0 ? sortedCompletedTasks : filteredCompletedTasks;

  // ===== MUTATIONS =====

  // Mutation to mark task as incomplete (undo completion)
  const uncompleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      // Get the current task to check if it's a daily task
      const currentTask = allTasks.find(task => task.id === taskId);

      if (currentTask?.section === 'daily') {
        // For daily tasks, we need to decrement completion count and clear last completed date
        const updates: Partial<TaskData> = {
          completed: false,
          completed_at: undefined,
          completion_count: Math.max((currentTask.completion_count || 1) - 1, 0),
          last_completed_date: (currentTask.completion_count || 1) <= 1 ? undefined : currentTask.last_completed_date
        };
        return todoApi.update(taskId, updates);
      } else {
        // For non-daily tasks, just mark as incomplete
        return todoApi.update(taskId, { completed: false, completed_at: undefined });
      }
    },
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData(['tasks']);

      queryClient.setQueryData(['tasks'], (old: TaskData[] = []) =>
        old.map(task => {
          if (task.id === taskId) {
            if (task.section === 'daily') {
              return {
                ...task,
                completed: false,
                completed_at: undefined,
                completion_count: Math.max((task.completion_count || 1) - 1, 0),
                last_completed_date: (task.completion_count || 1) <= 1 ? undefined : task.last_completed_date
              };
            } else {
              return { ...task, completed: false, completed_at: undefined };
            }
          }
          return task;
        })
      );

      return { previousTasks };
    },
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Mutation to delete a completed task
  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => todoApi.delete(taskId),
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData(['tasks']);

      queryClient.setQueryData(['tasks'], (old: TaskData[] = []) =>
        old.filter(task => task.id !== taskId)
      );

      return { previousTasks };
    },
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Mutation to clear all completed tasks
  const clearAllCompletedMutation = useMutation({
    mutationFn: () => Promise.all([
      todoApi.deleteCompleted('daily'),
      todoApi.deleteCompleted('today'),
      todoApi.deleteCompleted('upcoming')
    ]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // ===== HELPER FUNCTIONS =====
  const getSectionLabel = (section: string) => {
    switch (section) {
      case 'daily': return '🔄 Daily';
      case 'today': return '📅 Today';
      case 'upcoming': return '⏳ Upcoming';
      default: return '📝 Other';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      // Handle both date strings (YYYY-MM-DD) and datetime strings (ISO format)
      if (dateString.includes('T') || dateString.includes(' ')) {
        // It's a datetime string - extract just the date part to avoid timezone conversion
        const datePart = dateString.split('T')[0] || dateString.split(' ')[0];
        const [year, month, day] = datePart.split('-').map(Number);
        if (!year || !month || !day) return dateString;

        // Create date object using local timezone to avoid UTC conversion
        const date = new Date(year, month - 1, day);
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        });
      } else {
        // It's a date string (like start_date), parse without timezone conversion
        const [year, month, day] = dateString.split('-').map(Number);
        if (!year || !month || !day) return dateString;

        // Create date object using local timezone to avoid UTC conversion
        const date = new Date(year, month - 1, day);

        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        });
      }
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

  // ===== EVENT HANDLERS =====
  const handleUncompleteTask = (taskId: string) => {
    uncompleteTaskMutation.mutate(taskId);
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTaskMutation.mutate(taskId);
  };

  const handleClearAllCompleted = () => {
    clearAllCompletedMutation.mutate();
  };

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTask(expandedTask === taskId ? null : taskId);
  };

  const handleDateFilterChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateFilter(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleDateFilter = () => {
    setDateFilter(prev => ({
      ...prev,
      enabled: !prev.enabled
    }));
  };

  const resetDateFilter = () => {
    setDateFilter({
      startDate: today,
      endDate: today,
      enabled: true
    });
  };

  const setWeekFilter = () => {
    setDateFilter({
      startDate: currentWeek.start,
      endDate: currentWeek.end,
      enabled: true
    });
  };

  const setMonthFilter = () => {
    setDateFilter({
      startDate: currentMonth.start,
      endDate: currentMonth.end,
      enabled: true
    });
  };

  const clearDateFilter = () => {
    setDateFilter(prev => ({
      ...prev,
      enabled: false
    }));
  };

  const getFilterDisplayText = () => {
    if (!dateFilter.enabled) return 'All dates';

    // Fix timezone issue: avoid using new Date() constructor with date strings for display
    const formatLocalDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString();
    };

    // Check if it's today
    if (dateFilter.startDate === dateFilter.endDate &&
      dateFilter.startDate === today) {
      return 'Today only';
    }

    // Check if it's current week
    if (dateFilter.startDate === currentWeek.start &&
      dateFilter.endDate === currentWeek.end) {
      return 'This week';
    }

    // Check if it's current month
    if (dateFilter.startDate === currentMonth.start &&
      dateFilter.endDate === currentMonth.end) {
      return 'This month';
    }

    // Check if it's the same date
    if (dateFilter.startDate === dateFilter.endDate) {
      return formatLocalDate(dateFilter.startDate);
    }

    // Date range
    return `${formatLocalDate(dateFilter.startDate)} - ${formatLocalDate(dateFilter.endDate)}`;
  };

  // Handle sorting for completed tasks
  const handleTasksSort = (sortedTasks: TaskData[]) => {
    setSortedCompletedTasks(sortedTasks);
  };

  // ===== RENDER =====
  if (isLoading) {
    return (
      <div className={`w-full p-6 bg-background flex items-center justify-center ${className}`}>
        <div className="text-muted-foreground">Loading completed tasks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`w-full p-6 bg-background flex items-center justify-center ${className}`}>
        <div className="text-destructive">
          Error loading completed tasks: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </div>
    );
  }

  const totalCompletedTasks = displayTasks.length;

  return (
    <div className={`w-full space-y-4 ${className}`}>
      {/* Header with Filter */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Completed Tasks</h2>
          <p className="text-muted-foreground">
            {totalCompletedTasks} task{totalCompletedTasks !== 1 ? 's' : ''} completed
            {dateFilter.enabled && (
              <span className="ml-2 text-xs">
                • Filtered by {getFilterDisplayText().toLowerCase()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Task Sorting Component */}
          {totalCompletedTasks > 0 && (
            <CompactTaskSorting
              tasks={filteredCompletedTasks}
              onTasksChange={handleTasksSort}
              defaultSort={{ field: 'created_at', order: 'desc' }}
            />
          )}

          {/* Date Filter Popover */}
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={dateFilter.enabled ? "default" : "outline"}
                size="sm"
                className="gap-2"
              >
                <Filter className="w-4 h-4" />
                {getFilterDisplayText()}
                {dateFilter.enabled && dateFilter.startDate !== today && (
                  <X className="w-3 h-3 ml-1" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Filter by Date</h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsFilterOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="enableFilter"
                      checked={dateFilter.enabled}
                      onChange={toggleDateFilter}
                      className="rounded"
                    />
                    <label htmlFor="enableFilter" className="text-sm font-medium">
                      Enable date filter
                    </label>
                  </div>

                  {dateFilter.enabled && (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">
                            From Date
                          </label>
                          <Input
                            type="date"
                            value={dateFilter.startDate}
                            onChange={(e) => handleDateFilterChange('startDate', e.target.value)}
                            className="text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground">
                            To Date
                          </label>
                          <Input
                            type="date"
                            value={dateFilter.endDate}
                            onChange={(e) => handleDateFilterChange('endDate', e.target.value)}
                            className="text-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={resetDateFilter}
                          className="text-xs"
                        >
                          Today Only
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={setWeekFilter}
                          className="text-xs"
                        >
                          This Week
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={setMonthFilter}
                          className="text-xs"
                        >
                          This Month
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearDateFilter}
                          className="text-xs"
                        >
                          Show All
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            ✅ {totalCompletedTasks}
          </Badge>

          {/* Clear All Button */}
          {totalCompletedTasks > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearAllCompleted}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* All Completed Tasks in Collapsible Container */}
      {totalCompletedTasks === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Check className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No completed tasks found</p>
              {dateFilter.enabled && (
                <p className="text-sm mt-2">Try adjusting your date filter</p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsTasksExpanded(!isTasksExpanded)}
                className="h-auto p-0 hover:bg-transparent"
              >
                {isTasksExpanded ? (
                  <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
              </Button>
              <CardTitle className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                All Completed Tasks
                <span className="text-sm font-normal text-muted-foreground">
                  ({totalCompletedTasks})
                </span>
              </CardTitle>
            </div>
          </CardHeader>

          {isTasksExpanded && (
            <CardContent>
              <div className="space-y-3">
                {displayTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    {/* Completion Indicator */}
                    <div className="w-5 h-5 bg-green-500 border-2 border-green-500 rounded flex items-center justify-center mt-0.5">
                      <Check className="w-3 h-3 text-white" />
                    </div>

                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div
                            className="text-sm font-medium cursor-pointer line-through text-muted-foreground"
                            onClick={() => toggleTaskExpansion(task.id)}
                          >
                            {task.title}
                          </div>
                          {/* Task Description - Shows inline next to title without strikethrough */}
                          {task.description && (
                            <span className="text-xs font-normal text-muted-foreground/80">
                              - {task.description}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                          {/* Priority Badge */}
                          {task.priority && (
                            <span className={`px-2 py-0.5 rounded-full font-medium ${getPriorityColor(task.priority)}`}>
                              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                            </span>
                          )}

                          {/* Section Badge */}
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 font-medium">
                            {getSectionLabel(task.section || 'other')}
                          </span>

                          {/* Dates */}
                          {(task.start_date || task.end_date) && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(task.start_date)}
                              {task.start_date && task.end_date && task.end_date !== task.start_date && ` - ${formatDate(task.end_date)}`}
                            </div>
                          )}

                          {/* Times */}
                          {(task.start_time || task.end_time) && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTime(task.start_time)}
                              {task.start_time && task.end_time && ` - ${formatTime(task.end_time)}`}
                            </div>
                          )}
                        </div>

                        {/* Completion Status */}
                        <div className="text-xs text-muted-foreground">
                          {task.completed_at ?
                            `Completed on ${formatDate(task.completed_at)}` :
                            'Marked as complete'
                          }
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUncompleteTask(task.id)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                        title="Mark as incomplete"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTask(task.id)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        title="Delete task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}