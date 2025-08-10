'use client'

import React from 'react';
import { AlertCircle, ChevronDown, ChevronUp, Filter, X, Trash2, Calendar, Clock, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { CompactTaskSorting } from '@/components/todo/TaskSortingComponent';
import { useIncompleteTasks } from './hooks';
import { IncompleteTasksProps, IncompleteTaskWithOverdue } from './types';
import { getSectionLabel } from '../shared/utils';
import { IncompleteTaskItem } from './IncompleteTaskItemProps';

export default function IncompleteTasks({ className }: IncompleteTasksProps) {
  const {
    incompleteTasks,
    totalIncompleteTasks,
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
    handleCompleteTask,
    handleDeleteTask,
  } = useIncompleteTasks();

  // Helper functions
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

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getOverdueColor = (overdueDays: number) => {
    if (overdueDays <= 0) return 'bg-gray-100 text-gray-800 border-gray-200';
    if (overdueDays <= 3) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (overdueDays <= 7) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getFilterDisplayText = () => {
    if (!dateFilter.enabled) return 'All dates';

    const formatLocalDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString();
    };

    const today = new Date().toISOString().split('T')[0];

    if (dateFilter.startDate === dateFilter.endDate && dateFilter.startDate === today) {
      return 'Today only';
    }

    if (dateFilter.startDate === dateFilter.endDate) {
      return formatLocalDate(dateFilter.startDate);
    }

    return `${formatLocalDate(dateFilter.startDate)} - ${formatLocalDate(dateFilter.endDate)}`;
  };

  if (isLoading) {
    return (
      <div className={`w-full mt-6 ${className}`}>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              Loading incomplete tasks...
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
              Error loading incomplete tasks: {error instanceof Error ? 
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
              placeholder="Search incomplete tasks..."
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

          {/* Compact Task Sorting */}
          {totalIncompleteTasks > 0 && (
            <CompactTaskSorting
              tasks={incompleteTasks}
              onTasksChange={(sortedTasks) => updateSortedTasks(sortedTasks as IncompleteTaskWithOverdue[])}
              defaultSort={{ field: 'start_date', order: 'asc' }}
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
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const today = new Date().toISOString().split('T')[0];
                          updateDateFilter({ startDate: today, endDate: today });
                        }}
                      >
                        Today
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const now = new Date();
                          const dayOfWeek = now.getDay();
                          const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                          
                          const monday = new Date(now);
                          monday.setDate(now.getDate() - daysFromMonday);
                          
                          const sunday = new Date(monday);
                          sunday.setDate(monday.getDate() + 6);
                          
                          const formatDate = (date: Date) => date.toISOString().split('T')[0];
                          
                          updateDateFilter({ 
                            startDate: formatDate(monday), 
                            endDate: formatDate(sunday) 
                          });
                        }}
                      >
                        This Week
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const now = new Date();
                          const year = now.getFullYear();
                          const month = now.getMonth();
                          
                          const firstDay = new Date(year, month, 1);
                          const lastDay = new Date(year, month + 1, 0);
                          
                          const formatDate = (date: Date) => date.toISOString().split('T')[0];
                          
                          updateDateFilter({ 
                            startDate: formatDate(firstDay), 
                            endDate: formatDate(lastDay) 
                          });
                        }}
                      >
                        This Month
                      </Button>
                    </div>

                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => updateDateFilter({ enabled: false })}
                      className="w-full"
                    >
                      Clear Filter
                    </Button>
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>

          <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
            ⚠️ {totalIncompleteTasks}
          </Badge>

          {/* Clear All Button */}
          {totalIncompleteTasks > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete all incomplete tasks? This action cannot be undone.')) {
                  console.log('Clear all incomplete tasks');
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

      {/* All Incomplete Tasks in Collapsible Container */}
      {totalIncompleteTasks === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No incomplete tasks found</p>
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
                <AlertCircle className="w-5 h-5 text-orange-600" />
                Incomplete Tasks
                <span className="text-sm font-normal text-muted-foreground">
                  ({totalIncompleteTasks})
                </span>
              </CardTitle>
            </div>
          </CardHeader>

          {isTasksExpanded && (
            <CardContent>
              {/* Tasks List */}
              <div className="space-y-3">
                {incompleteTasks.map((task) => (
                  <IncompleteTaskItem
                    key={task.id}
                    task={task}
                    isExpanded={expandedTask === task.id}
                    onToggleExpansion={toggleTaskExpansion}
                    onCompleteTask={handleCompleteTask}
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