'use client'

import React from 'react';
import { Check, ChevronDown, ChevronUp, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CompactTaskSorting } from '@/components/todo/TaskSortingComponent';
import { CompletedTaskItem } from './CompletedTaskItem';
import { useCompletedTasks } from './hooks';
import { CompletedTasksProps, CompletedTaskWithCompletion } from './types';

export default function CompletedTasks({ className }: CompletedTasksProps) {
  const {
    completedTasks,
    totalCompletedTasks,
    expandedTask,
    isTasksExpanded,
    searchQuery,
    dateFilter,
    isLoading,
    error,
    toggleTaskExpansion,
    toggleTasksExpansion,
    updateSearchQuery,
    updateDateFilter,
    updateSortedTasks,
    handleUncompleteTask,
    handleDeleteTask,
  } = useCompletedTasks();

  // Helper functions (from original component)
  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      const [year, month, day] = dateString.split('-').map(Number);
      if (!year || !month || !day) return dateString;

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

  const getSectionLabel = (section: string) => {
    switch (section) {
      case 'daily': return 'Daily';
      case 'today': return 'Today';
      case 'upcoming': return 'Upcoming';
      default: return 'Other';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  // Handle filter reset
  const resetFilters = () => {
    updateSearchQuery('');
    updateDateFilter({
      enabled: false,
      startDate: '',
      endDate: ''
    });
  };

  // Calculate active filter count
  const activeFiltersCount = 
    (searchQuery.trim() ? 1 : 0) + 
    (dateFilter.enabled ? 1 : 0);

  if (isLoading) {
    return (
      <div className="w-full p-6 bg-background">
        <div className="text-muted-foreground text-center">Loading completed tasks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-6 bg-background">
        <div className="text-destructive text-center">
          Error loading completed tasks: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full p-6 bg-background ${className || ''}`}>
      {totalCompletedTasks > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={toggleTasksExpansion}
                className="p-0 h-auto hover:bg-transparent"
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
              
              {/* Filter Controls */}
              <div className="flex items-center gap-2">
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear ({activeFiltersCount})
                  </Button>
                )}
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Filter className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80" align="end">
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">Filter Completed Tasks</h4>
                      
                      {/* Search Filter */}
                      <div className="space-y-2">
                        <Label htmlFor="search" className="text-xs">Search tasks</Label>
                        <Input
                          id="search"
                          placeholder="Search by title or description..."
                          value={searchQuery}
                          onChange={(e) => updateSearchQuery(e.target.value)}
                          className="h-8"
                        />
                      </div>
                      
                      {/* Date Range Filter */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Switch
                            id="date-filter"
                            checked={dateFilter.enabled}
                            onCheckedChange={(enabled) => updateDateFilter({ enabled })}
                          />
                          <Label htmlFor="date-filter" className="text-xs">Filter by completion date</Label>
                        </div>
                        
                        {dateFilter.enabled && (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label htmlFor="start-date" className="text-xs">From</Label>
                              <Input
                                id="start-date"
                                type="date"
                                value={dateFilter.startDate}
                                onChange={(e) => updateDateFilter({ startDate: e.target.value })}
                                className="h-8"
                              />
                            </div>
                            <div>
                              <Label htmlFor="end-date" className="text-xs">To</Label>
                              <Input
                                id="end-date"
                                type="date"
                                value={dateFilter.endDate}
                                onChange={(e) => updateDateFilter({ endDate: e.target.value })}
                                className="h-8"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardHeader>

          {isTasksExpanded && (
            <CardContent>
              {/* Task Sorting */}
              <div className="mb-4">
                <CompactTaskSorting
                  tasks={completedTasks}
                  onTasksChange={(sortedTasks) => updateSortedTasks(sortedTasks as CompletedTaskWithCompletion[])}
                />
              </div>

              {/* Completed Tasks List */}
              <div className="space-y-3">
                {completedTasks.length === 0 ? (
                  <div className="text-center text-muted-foreground py-4">
                    No completed tasks match your filters
                  </div>
                ) : (
                  completedTasks.map((task) => (
                    <CompletedTaskItem
                      key={task.completion.id}
                      task={task}
                      isExpanded={expandedTask === task.completion.id}
                      onToggleExpansion={toggleTaskExpansion}
                      onUncompleteTask={handleUncompleteTask}
                      onDeleteTask={handleDeleteTask}
                      formatDate={formatDate}
                      formatTime={formatTime}
                      getSectionLabel={getSectionLabel}
                      getPriorityColor={getPriorityColor}
                    />
                  ))
                )}
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}