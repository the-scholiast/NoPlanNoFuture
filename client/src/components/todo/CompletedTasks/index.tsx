'use client'

import React from 'react';
import { Check, ChevronDown, ChevronUp, Filter, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CompactTaskSorting } from '@/components/todo/shared/components/TaskSortingComponent';
import { CompletedTaskItem } from './CompletedTaskItem';
import { useCompletedTasks } from './hooks';
import { CompletedTasksProps, CompletedTaskWithCompletion } from './types';
import { getSectionLabel } from '../shared/utils';
import { formatDate, formatTime, getPriorityColor, } from '../shared/utils';
import { DateFilter } from '../shared/components/DateFilter';

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

  const handleDateFilterChange = (filter: any) => {
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
          <DateFilter
            dateFilter={dateFilter}
            onFilterChange={handleDateFilterChange}
          />

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