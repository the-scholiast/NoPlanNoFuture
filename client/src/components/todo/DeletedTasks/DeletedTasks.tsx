'use client'

import React from 'react';
import { Archive, ChevronDown, ChevronUp, X, Trash2, AlertCircle } from 'lucide-react';
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
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Date Filter */}
          <DateFilter
            dateFilter={dateFilter}
            onFilterChange={updateDateFilter}
          />

          <div className='flex items-center gap-2 bg-gray-500 rounded-2xl px-2 text-sm'>
            <Archive className="w-3 h-3" />
            {totalDeletedTasks}
          </div>


          {/* Clear All Button */}
          {totalDeletedTasks > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (window.confirm('Are you sure you want to hard delete all deleted tasks from database? This action cannot be undone.')) {
                  handleClearAllTasks();
                }
              }}
              className="text-muted-foreground hover:text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>

      </div>

      {/* Tasks Card */}
      {totalDeletedTasks === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No deleted tasks found</p>
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
              <div className="w-5 h-5 bg-gray-500 border-2 border-gray-500 rounded flex items-center justify-center mt-0.5">
                <Archive className="w-5 h-5" />
              </div>
              <CardTitle className="text-lg">
                Deleted Tasks ({totalDeletedTasks})
              </CardTitle>
            </div>
          </CardHeader>

          {isTasksExpanded && (
            <CardContent className="pt-0">
              <div className="space-y-1">
                {deletedTasks.map((task) => (
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
                ))}
              </div>
            </CardContent>
          )}
        </ Card>
      )}
    </div>
  );
}