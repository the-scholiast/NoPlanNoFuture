'use client'

import React from 'react';
import { Check, ChevronDown, ChevronUp, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CompactTaskSorting } from '@/components/todo/shared/components/TaskSortingComponent';
import { CompletedTaskItem } from './CompletedTaskItem';
import { useCompletedTasks } from './hooks/useCompletedTasks';
import { CompletedTasksProps, CompletedTaskWithCompletion } from './types';
import { formatDate, formatTime, getPriorityColor, getSectionLabel } from '../shared/utils';
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
    setSortConfiguration, // ADD this
    handleUncompleteTask,
    handleDeleteTask,
    handleClearAllTasks,
  } = useCompletedTasks();

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
              Error loading completed tasks: {error instanceof Error ? error.message : 'Unknown error'}
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

          {/* Compact Task Sorting */}
          {totalCompletedTasks > 0 && (
            <CompactTaskSorting
              tasks={completedTasks}
              onTasksChange={() => { }} // Empty function - not used anymore
              onSortChange={setSortConfiguration} // ADD this
              defaultSort={{ field: 'start_date', order: 'desc' }}
              className="flex-shrink-0"
            />
          )}

          {/* Date Filter */}
          <DateFilter
            dateFilter={dateFilter}
            onFilterChange={updateDateFilter}
          />

          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            ✓ {totalCompletedTasks}
          </Badge>

          {/* Clear All Button */}
          {totalCompletedTasks > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete all completed tasks? This action cannot be undone.')) {
                  handleClearAllTasks();
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
                {isTasksExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
              <div className="w-5 h-5 bg-green-500 border-2 border-green-500 rounded flex items-center justify-center mt-0.5">
                      <Check className="w-3 h-3 text-white" />
                    </div>
              
              <CardTitle className="text-lg">
                Completed Tasks ({totalCompletedTasks})
              </CardTitle>
            </div>
          </CardHeader>

          {isTasksExpanded && (
            <CardContent className="pt-0">
              <div className="space-y-1">
                {completedTasks.map((task) => (
                  <CompletedTaskItem
                    key={`${task.id}-${task.completion?.id}`}
                    task={task}
                    isExpanded={expandedTask === task.completion?.id}
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