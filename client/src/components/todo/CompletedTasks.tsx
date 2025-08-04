'use client'

import React, { useState, useMemo } from 'react';
import { Check, Trash2, RotateCcw, Calendar, Clock, ChevronDown, ChevronRight, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TaskData } from '@/types/todoTypes';
import { todoApi } from '@/lib/api/todos';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface CompletedTasksProps {
  className?: string;
}

export default function CompletedTasks({ className }: CompletedTasksProps) {
  const queryClient = useQueryClient();
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('today');

  // Date filter state - default to show all
  const today = new Date().toISOString().split('T')[0];
  const [dateFilter, setDateFilter] = useState({
    startDate: today,
    endDate: today,
    enabled: false
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // ===== DATA FETCHING =====
  const {
    data: allTasks = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => todoApi.getCompleted(),
    staleTime: 5 * 60 * 1000,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Filter completed tasks and group by section
  const completedTasks = allTasks.filter(task => task.completed);

  // Apply date filter to completed tasks
  const filteredCompletedTasks = useMemo(() => {
    if (!dateFilter.enabled) {
      return completedTasks;
    }

    return completedTasks.filter(task => {
      const taskDate = new Date(task.completed_at || task.created_at).toISOString().split('T')[0];
      return taskDate >= dateFilter.startDate && taskDate <= dateFilter.endDate;
    });
  }, [completedTasks, dateFilter, allTasks]); // Added allTasks as dependency

  // Group filtered completed tasks by section
  const groupedCompletedTasks = useMemo(() => ({
    daily: filteredCompletedTasks.filter(task => task.section === 'daily'),
    today: filteredCompletedTasks.filter(task => task.section === 'today'),
    upcoming: filteredCompletedTasks.filter(task => task.section === 'upcoming')
  }), [filteredCompletedTasks]);

  // ===== MUTATIONS =====

  // Mutation to mark task as incomplete (undo completion)
  const uncompleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => todoApi.update(taskId, { completed: false }),
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData(['tasks']);

      queryClient.setQueryData(['tasks'], (old: TaskData[] = []) =>
        old.map(task => task.id === taskId ? { ...task, completed: false } : task)
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

  // Mutation to clear all completed tasks in a section
  const clearCompletedMutation = useMutation({
    mutationFn: (section: 'daily' | 'today' | 'upcoming') =>
      todoApi.deleteCompleted(section),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // ===== HELPER FUNCTIONS =====
  const getSectionTitle = (section: string) => {
    switch (section) {
      case 'daily': return 'Daily Tasks';
      case 'today': return 'Today\'s Tasks';
      case 'upcoming': return 'Upcoming Tasks';
      default: return 'Tasks';
    }
  };

  const getSectionEmoji = (section: string) => {
    switch (section) {
      case 'daily': return '🔄';
      case 'today': return '📅';
      case 'upcoming': return '⏳';
      default: return '✅';
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
    return new Date(dateString).toLocaleDateString();
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return null;
    return timeString;
  };

  // ===== EVENT HANDLERS =====
  const handleUncompleteTask = (taskId: string) => {
    uncompleteTaskMutation.mutate(taskId);
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTaskMutation.mutate(taskId);
  };

  const handleClearCompleted = (section: 'daily' | 'today' | 'upcoming') => {
    clearCompletedMutation.mutate(section);
  };

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTask(expandedTask === taskId ? null : taskId);
  };

  const toggleSectionExpansion = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
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
    const today = new Date().toISOString().split('T')[0];
    setDateFilter({
      startDate: today,
      endDate: today,
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

    const startDate = new Date(dateFilter.startDate);
    const endDate = new Date(dateFilter.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if it's today
    if (dateFilter.startDate === dateFilter.endDate &&
      startDate.toDateString() === today.toDateString()) {
      return 'Today only';
    }

    // Check if it's the same date
    if (dateFilter.startDate === dateFilter.endDate) {
      return startDate.toLocaleDateString();
    }

    // Date range
    return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
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

  const totalCompletedTasks = filteredCompletedTasks.length;

  if (totalCompletedTasks === 0) {
    // Only show empty state if we're not loading and definitely have no completed tasks
    if (isLoading) {
      return (
        <div className={`w-full p-6 bg-background flex items-center justify-center ${className}`}>
          <div className="text-muted-foreground">Loading completed tasks...</div>
        </div>
      );
    }

    return (
      <div className={`w-full p-6 ${className}`}>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Completed Tasks</h3>
            <p className="text-sm text-muted-foreground text-center">
              Once you complete some tasks, they'll appear here for you to review.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

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

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={resetDateFilter}
                          className="flex-1"
                        >
                          Today Only
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearDateFilter}
                          className="flex-1"
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
        </div>
      </div>

      {/* Completed Tasks by Section */}
      {(['today', 'daily', 'upcoming'] as const).map((sectionKey) => {
        const sectionTasks = groupedCompletedTasks[sectionKey];
        const sectionTitle = getSectionTitle(sectionKey);
        const sectionEmoji = getSectionEmoji(sectionKey);
        const isExpanded = expandedSection === sectionKey;

        if (sectionTasks.length === 0) return null;

        return (
          <Card key={sectionKey} className="overflow-hidden">
            <CardHeader
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleSectionExpansion(sectionKey)}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <span>{sectionEmoji}</span>
                  {sectionTitle}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {sectionTasks.length} completed
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearCompleted(sectionKey);
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    Clear All
                  </Button>
                </div>
              </div>
            </CardHeader>

            {isExpanded && (
              <CardContent className="pt-0">
                <div className="space-y-3">
                  {sectionTasks.map((task) => (
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
                          <div
                            className="text-sm font-medium cursor-pointer line-through text-muted-foreground"
                            onClick={() => toggleTaskExpansion(task.id)}
                          >
                            {task.title}
                          </div>

                          {/* Task Description - Shows when expanded */}
                          {expandedTask === task.id && task.description && (
                            <div className="text-xs text-muted-foreground p-2 bg-background rounded border">
                              {task.description}
                            </div>
                          )}

                          {/* Priority Badge */}
                          {task.priority && (
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityColor(task.priority)}`}>
                                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                              </span>
                            </div>
                          )}

                          {/* Date and Time Information */}
                          {(task.start_date || task.end_date || task.start_time || task.end_time) && (
                            <div className="space-y-1">
                              {/* Dates */}
                              {(task.start_date || task.end_date) && (
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(task.start_date)}
                                  {task.start_date && task.end_date && task.end_date !== task.start_date && ` - ${formatDate(task.end_date)}`}
                                </div>
                              )}

                              {/* Times */}
                              {(task.start_time || task.end_time) && (
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatTime(task.start_time)}
                                  {task.start_time && task.end_time && ` - ${formatTime(task.end_time)}`}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Completion Status */}
                          <div className="text-xs text-muted-foreground">
                            {task.completed_at ?
                              `✅ Completed on ${formatDate(task.completed_at)}` :
                              '✅ Marked as complete'
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
        );
      })}
    </div>
  );
}