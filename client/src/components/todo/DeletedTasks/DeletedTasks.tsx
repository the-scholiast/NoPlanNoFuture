'use client'

import React from 'react';
import { Archive, ChevronDown, ChevronUp, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useDeletedTasks } from './hooks/useDeletedTasks';
import { DeletedTasksProps } from './types';
import { DeletedTaskItem } from './DeletedTaskItem';
import { DateFilter } from '../shared/components/DateFilter';
import { formatDate, formatTime, getPriorityColor, getSectionLabel } from '../shared';

export default function DeletedTasks({ className }: DeletedTasksProps) {
  const {
    deletedTasks,
    totalDeletedTasks,
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
    handleRestoreTask,
    handlePermanentDeleteTask,
    handleClearAllTasks,
  } = useDeletedTasks();

  if (isLoading) {
    return (
      <div className={`w-full mt-6 ${className}`}>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              Loading deleted tasks...
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
              Error loading deleted tasks
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
              placeholder="Search deleted tasks..."
              value={searchQuery}
              onChange={(e) => updateSearchQuery(e.target.value)}
              className="w-64"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                onClick={() => updateSearchQuery('')}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>

          {/* Date Filter */}
          <DateFilter
            dateFilter={dateFilter}
            onFilterChange={updateDateFilter}
          />
        </div>

        {/* Clear All Button */}
        {totalDeletedTasks > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleClearAllTasks}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear All ({totalDeletedTasks})
          </Button>
        )}
      </div>

      {/* Tasks Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Archive className="w-5 h-5" />
              Deleted Tasks
              {totalDeletedTasks > 0 && (
                <Badge variant="secondary">{totalDeletedTasks}</Badge>
              )}
            </CardTitle>
            {totalDeletedTasks > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTasksExpansion}
                className="p-1 h-8 w-8"
              >
                {isTasksExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-2">
          {totalDeletedTasks === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No deleted tasks found
            </div>
          ) : !isTasksExpanded ? (
            <div className="text-center text-muted-foreground py-4">
              Click to expand {totalDeletedTasks} deleted task{totalDeletedTasks > 1 ? 's' : ''}
            </div>
          ) : (
            deletedTasks.map((task) => (
              <DeletedTaskItem
                key={task.id}
                task={task}
                isExpanded={expandedTask === task.id}
                onToggleExpansion={toggleTaskExpansion}
                onRestoreTask={handleRestoreTask}
                onPermanentDeleteTask={handlePermanentDeleteTask}
                formatDate={formatDate}
                formatTime={formatTime}
                getSectionLabel={getSectionLabel}
                getPriorityColor={getPriorityColor}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}