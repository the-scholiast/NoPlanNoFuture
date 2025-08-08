'use client'

import React from 'react';
import { Check, ChevronDown, ChevronUp, Filter, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { CompactTaskSorting } from '@/components/todo/TaskSortingComponent';
import { CompletedTaskItem } from './CompletedTaskItem';
import { useCompletedTasks } from './hooks';
import { CompletedTasksProps, CompletedTaskWithCompletion } from './types';
import { formatDateString } from '@/lib/utils/dateUtils';

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
      const [hours, minutes] = timeString.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) return timeString;

      const date = new Date();
      date.setHours(hours, minutes);

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
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Quick filter functions
  const setTodayFilter = () => {
    const today = new Date().toISOString().split('T')[0];
    updateDateFilter({
      startDate: today,
      endDate: today,
      enabled: true
    });
  };

  const setWeekFilter = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday to 6, others to dayOfWeek - 1

    const monday = new Date(today);
    monday.setDate(today.getDate() - daysFromMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    updateDateFilter({
      startDate: formatDateString(monday),
      endDate: formatDateString(sunday),
      enabled: true
    });
  };

  const setMonthFilter = () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    updateDateFilter({
      startDate: startOfMonth.toISOString().split('T')[0],
      endDate: endOfMonth.toISOString().split('T')[0],
      enabled: true
    });
  };

  const clearDateFilter = () => {
    updateDateFilter({ enabled: false });
  };

  const getFilterDisplayText = () => {
    if (!dateFilter.enabled) return 'All dates';

    const today = new Date().toISOString().split('T')[0];

    if (dateFilter.startDate === dateFilter.endDate) {
      if (dateFilter.startDate === today) {
        return 'Today only';
      }
      return formatDate(dateFilter.startDate) || 'Selected date';
    }

    return `${formatDate(dateFilter.startDate)} - ${formatDate(dateFilter.endDate)}`;
  };

  // Handle clear all completed tasks
  const handleClearAllCompleted = () => {
    if (window.confirm('Are you sure you want to delete all completed tasks? This action cannot be undone.')) {
      // Implementation would go here
      console.log('Clear all completed tasks');
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`w-full mt-6 ${className}`}>
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading completed tasks...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`w-full mt-6 ${className}`}>
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-destructive">
              <p>Error loading completed tasks</p>
              <p className="text-sm mt-2">{error instanceof Error ? error.message : 'Unknown error'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`w-full mt-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Input
              placeholder="Search completed tasks..."
              value={searchQuery}
              onChange={(e) => updateSearchQuery(e.target.value)}
              className="w-64"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateSearchQuery('')}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Date Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                {getFilterDisplayText()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Date Filter</Label>
                  <Switch
                    checked={dateFilter.enabled}
                    onCheckedChange={(checked) => updateDateFilter({ enabled: checked })}
                  />
                </div>

                {dateFilter.enabled && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="start-date">Start Date</Label>
                        <Input
                          id="start-date"
                          type="date"
                          value={dateFilter.startDate}
                          onChange={(e) => updateDateFilter({ startDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="end-date">End Date</Label>
                        <Input
                          id="end-date"
                          type="date"
                          value={dateFilter.endDate}
                          onChange={(e) => updateDateFilter({ endDate: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" onClick={setTodayFilter}>
                        Today
                      </Button>
                      <Button variant="outline" size="sm" onClick={setWeekFilter}>
                        This Week
                      </Button>
                      <Button variant="outline" size="sm" onClick={setMonthFilter}>
                        This Month
                      </Button>
                      <Button variant="outline" size="sm" onClick={clearDateFilter}>
                        Show All
                      </Button>
                    </div>
                  </>
                )}
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
                onClick={toggleTasksExpansion}
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
                Completed Tasks
                <span className="text-sm font-normal text-muted-foreground">
                  ({totalCompletedTasks})
                </span>
              </CardTitle>
            </div>
          </CardHeader>

          {isTasksExpanded && (
            <CardContent>
              {/* Sorting */}
              {totalCompletedTasks > 1 && (
                <div className="mb-4">
                  <CompactTaskSorting
                    tasks={completedTasks}
                    onTasksChange={(sortedTasks) => updateSortedTasks(sortedTasks as CompletedTaskWithCompletion[])}
                  />
                </div>
              )}

              {/* Tasks List */}
              <div className="space-y-3">
                {completedTasks.map((task) => (
                  <CompletedTaskItem
                    key={`${task.id}-${task.completion.id}`}
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
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}