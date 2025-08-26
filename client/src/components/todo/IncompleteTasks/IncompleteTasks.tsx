'use client'

import React from 'react';
import { AlertCircle, ChevronDown, ChevronUp, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useIncompleteTasks } from './hooks/useIncompleteTasks';
import { IncompleteTasksProps } from './types';
import { IncompleteTaskItem } from './IncompleteTaskItemProps';
import { DateFilter } from '../shared/components/DateFilter';
import { formatDate, formatTime, getPriorityColor, getSectionLabel } from '../shared';

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
    handleCompleteTask,
    handleDeleteTask,
    handleClearAllTasks,
  } = useIncompleteTasks();

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
              Error loading incomplete tasks: {error}
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

          {/* Date Filter */}
          <DateFilter
            dateFilter={dateFilter}
            onFilterChange={updateDateFilter}
          />

          <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
            ⚠️ {totalIncompleteTasks}
          </Badge>

          {/* Clear All Button */}
          {totalIncompleteTasks > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete all incomplete tasks?')) {
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
                {isTasksExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
              <div className="w-5 h-5 bg-orange-500 border-2 border-orange-500 rounded flex items-center justify-center mt-0.5">
                <AlertCircle className="w-3 h-3 text-white" />
              </div>
              <CardTitle className="text-lg">
                Incomplete Tasks ({totalIncompleteTasks})
              </CardTitle>
            </div>
          </CardHeader>

          {isTasksExpanded && (
            <CardContent className="pt-0">
              <div className="space-y-1">
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