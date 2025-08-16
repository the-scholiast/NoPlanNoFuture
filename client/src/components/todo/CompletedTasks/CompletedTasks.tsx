'use client'

import React from 'react';
import { Check, Trash2, RotateCcw, Calendar, Clock, Filter, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CompactTaskSorting } from '@/components/todo/shared/components/TaskSortingComponent';
import { useCompletedTasks } from './hooks/useCompletedTasks';

interface CompletedTasksProps {
  className?: string;
}

export default function CompletedTasks({ className }: CompletedTasksProps) {
  // All logic comes from the hook - component is just UI
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
    updateSortedTasks,
    handleUncompleteTask,
    handleDeleteTask,
    // Date filter functions (should all come from hook)
    handleDateFilterChange,
    toggleDateFilter,
    resetDateFilter,
    setWeekFilter,
    setMonthFilter,
    clearDateFilter,
    getFilterDisplayText,
  } = useCompletedTasks();

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

  return (
    <div className={`w-full ${className}`}>
      <Card>
        <CardHeader 
          className="cursor-pointer" 
          onClick={toggleTasksExpansion}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              Completed Tasks
              <Badge variant="secondary" className="ml-2">
                {totalCompletedTasks}
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              {isTasksExpanded && (
                <>
                  <Input
                    placeholder="Search completed tasks..."
                    value={searchQuery}
                    onChange={(e) => updateSearchQuery(e.target.value)}
                    className="w-48 h-8"
                  />
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8">
                        <Filter className="w-4 h-4 mr-1" />
                        {getFilterDisplayText()}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80" align="end">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Date Filter</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleDateFilter}
                            className="h-auto p-1"
                          >
                            <span className={`w-2 h-2 rounded-full ${dateFilter.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-gray-600">Start Date</label>
                            <Input
                              type="date"
                              value={dateFilter.startDate}
                              onChange={(e) => handleDateFilterChange('startDate', e.target.value)}
                              disabled={!dateFilter.enabled}
                              className="h-8"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-600">End Date</label>
                            <Input
                              type="date"
                              value={dateFilter.endDate}
                              onChange={(e) => handleDateFilterChange('endDate', e.target.value)}
                              disabled={!dateFilter.enabled}
                              className="h-8"
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          <Button variant="outline" size="sm" onClick={resetDateFilter} className="h-7 text-xs">
                            Today
                          </Button>
                          <Button variant="outline" size="sm" onClick={setWeekFilter} className="h-7 text-xs">
                            This Week
                          </Button>
                          <Button variant="outline" size="sm" onClick={setMonthFilter} className="h-7 text-xs">
                            This Month
                          </Button>
                          <Button variant="outline" size="sm" onClick={clearDateFilter} className="h-7 text-xs">
                            All Dates
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  
                </>
              )}
              
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                {isTasksExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        {isTasksExpanded && (
          <CardContent>
            {completedTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? 'No completed tasks match your search.' : 'No completed tasks found.'}
              </div>
            ) : (
              <div className="space-y-2">
                {completedTasks.map((task) => (
                  <div
                    key={task.completion?.id || task.id}
                    className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <span className="font-medium text-sm line-through text-gray-600 dark:text-gray-400">
                            {task.title}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {task.section}
                          </Badge>
                          {task.is_recurring_instance && (
                            <Badge variant="outline" className="text-xs">
                              Recurring
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {task.completion?.completed_at && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span>Completed: {new Date(task.completion.completed_at).toLocaleDateString()}</span>
                            </div>
                          )}
                          {task.start_date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>Due: {new Date(task.start_date).toLocaleDateString()}</span>
                            </div>
                          )}
                          {task.completion_count && task.completion_count > 1 && (
                            <div className="flex items-center gap-1">
                              <span>Completed {task.completion_count} times</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleTaskExpansion(task.completion?.id || task.id)}
                          className="h-8 w-8 p-0"
                        >
                          {expandedTask === (task.completion?.id || task.id) ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUncompleteTask(task.completion?.id || task.id)}
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                          title="Mark as incomplete"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTask(task.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          title="Delete permanently"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {expandedTask === (task.completion?.id || task.id) && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                        {task.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                            {task.description}
                          </p>
                        )}
                        
                        <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <div>
                            <span className="font-medium">Priority:</span> {task.priority}
                          </div>
                          <div>
                            <span className="font-medium">Section:</span> {task.section}
                          </div>
                          {task.start_time && (
                            <div>
                              <span className="font-medium">Time:</span> {task.start_time}
                              {task.end_time && ` - ${task.end_time}`}
                            </div>
                          )}
                          {task.completion?.completed_at && (
                            <div>
                              <span className="font-medium">Completed:</span> {new Date(task.completion.completed_at).toLocaleString()}
                            </div>
                          )}
                          {task.completion?.instance_date && (
                            <div>
                              <span className="font-medium">Instance Date:</span> {new Date(task.completion.instance_date).toLocaleDateString()}
                            </div>
                          )}
                          {task.is_recurring_instance && (
                            <div>
                              <span className="font-medium">Type:</span> Recurring Instance
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}