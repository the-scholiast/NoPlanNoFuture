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
import { CompactTaskSorting } from '@/components/todo/shared/components/TaskSortingComponent';
import { CompletedTaskItem } from './CompletedTaskItem';
import { useCompletedTasks } from './hooks';
import { CompletedTasksProps, CompletedTaskWithCompletion } from './types';
import { formatDateString, getTodayString } from '@/lib/utils/dateUtils';
import { getSectionLabel } from '../shared/utils';
import { formatDate, formatTime, getPriorityColor, } from '../shared/utils';

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

  const getFilterDisplayText = () => {
    if (!dateFilter.enabled) return 'All dates';

    const formatLocalDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString();
    };

    const today = getTodayString();

    if (dateFilter.startDate === dateFilter.endDate && dateFilter.startDate === today) {
      return 'Today only';
    }

    if (dateFilter.startDate === dateFilter.endDate) {
      return formatLocalDate(dateFilter.startDate);
    }

    return `${formatLocalDate(dateFilter.startDate)} - ${formatLocalDate(dateFilter.endDate)}`;
  };

  // Handle filter changes with debug logging
  const handleDateFilterChange = (filter: any) => {
    console.log('🔍 Date filter changing:', {
      old: dateFilter,
      new: { ...dateFilter, ...filter },
      timestamp: getTodayString(),
    });
    updateDateFilter(filter);
  };

  if (isLoading) {
    return (
      <div className={`w-full mt-6 ${className}`}>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              Loading completed tasks...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`w-full mt-6 ${className}`}>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-destructive">
              Error loading completed tasks: {error instanceof Error ?
                error.message : 'Unknown error'}
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

          {/* Compact Task Sorting - between search and date filter */}
          {totalCompletedTasks > 0 && (
            <CompactTaskSorting
              tasks={completedTasks}
              onTasksChange={(sortedTasks) => updateSortedTasks(sortedTasks as CompletedTaskWithCompletion[])}
              defaultSort={{ field: 'created_at', order: 'desc' }}
              className="flex-shrink-0"
            />
          )}

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
                    onCheckedChange={(checked) => handleDateFilterChange({ enabled: checked })}
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
                          onChange={(e) => {
                            const newStartDate = e.target.value;
                            console.log('📅 Start date changed to:', newStartDate);
                            handleDateFilterChange({ startDate: newStartDate });
                          }}
                        />
                      </div>
                      <div>
                        <Label htmlFor="end-date">End Date</Label>
                        <Input
                          id="end-date"
                          type="date"
                          value={dateFilter.endDate}
                          onChange={(e) => {
                            const newEndDate = e.target.value;
                            console.log('📅 End date changed to:', newEndDate);
                            handleDateFilterChange({ endDate: newEndDate });
                          }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const today = getTodayString();
                          console.log('📅 Setting filter to today:', today);
                          handleDateFilterChange({ startDate: today, endDate: today });
                        }}
                      >
                        Today
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Set to current week (Monday to Sunday)
                          const now = new Date();
                          const dayOfWeek = now.getDay();
                          const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

                          const monday = new Date(now);
                          monday.setDate(now.getDate() - daysFromMonday);

                          const sunday = new Date(monday);
                          sunday.setDate(monday.getDate() + 6);

                          const startDate = formatDateString(monday);
                          const endDate = formatDateString(sunday);

                          console.log('📅 Setting filter to this week:', { startDate, endDate });
                          handleDateFilterChange({ startDate, endDate });
                        }}
                      >
                        This Week
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Set to current month
                          const now = new Date();
                          const year = now.getFullYear();
                          const month = now.getMonth();

                          const firstDay = new Date(year, month, 1);
                          const lastDay = new Date(year, month + 1, 0);

                          const startDate = formatDateString(firstDay);
                          const endDate = formatDateString(lastDay);

                          console.log('📅 Setting filter to this month:', { startDate, endDate });
                          handleDateFilterChange({ startDate, endDate });
                        }}
                      >
                        This Month
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        console.log('📅 Clearing filter');
                        handleDateFilterChange({ enabled: false });
                      }}
                      className="w-full"
                    >
                      Clear Filter
                    </Button>
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
              onClick={() => {
                if (window.confirm('Are you sure you want to delete all completed tasks? This action cannot be undone.')) {
                  console.log('Clear all completed tasks');
                }
              }}
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