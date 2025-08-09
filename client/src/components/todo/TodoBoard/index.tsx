"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Settings, Trash2, Edit3, Calendar, Clock, Repeat, } from 'lucide-react';
import { useTodoBoard } from './hooks/useTodoBoard';
import EditTaskModal from '../EditTaskModal';
import UpcomingDateFilter from '../UpcomingDateFilter';
import { CompactTaskSorting } from '../TaskSortingComponent';
import { TodoBoardProps } from '../shared/types';
import { TaskData } from '@/types/todoTypes';
import { useTodoMutations } from '../shared/hooks/useTodoMutations';

export default function TodoBoard({ onAddTasks }: TodoBoardProps) {
  const {
    sections,
    filteredDailyTasks,
    todayTasksWithRecurring,
    filteredUpcomingTasks,
    filteredUpcomingRecurringTasks,
    expandedTask,
    editModalOpen,
    setEditModalOpen,
    taskToEdit,
    upcomingFilter,
    setUpcomingFilter,
    openEditModal,
    handleTasksSort,
    toggleTaskExpansion,
    formatDate,
    formatTime,
    isRecurringInstance,
    getRecurringPatternDisplay,
    isLoading,
    error,
  } = useTodoBoard();

  // Use shared mutations for all task operations
  const {
    updateTaskMutation,
    deleteTaskMutation,
    clearCompletedMutation,
    clearAllMutation,
    toggleTaskFunction
  } = useTodoMutations();

  const handleTaskUpdated = () => {
    // Handled by mutations in the hook
  };

  // Get all tasks for the toggle function
  const allTasks = [
    ...filteredDailyTasks,
    ...todayTasksWithRecurring,
    ...filteredUpcomingTasks,
    ...filteredUpcomingRecurringTasks,
  ];

  // Use shared toggle function
  const toggleTask = (taskId: string) => {
    // Create a proper function wrapper that ensures boolean return
    const isRecurringInstanceFn = (task: TaskData): boolean => {
      return Boolean(task.id?.includes('_') && task.parent_task_id);
    };

    toggleTaskFunction(taskId, allTasks, isRecurringInstanceFn);
  };

  // Use shared delete function
  const deleteTask = (taskId: string) => {
    deleteTaskMutation.mutate(taskId);
  };

  // Use shared clear functions
  const clearCompleted = (sectionIndex: number) => {
    const section = sections[sectionIndex];
    clearCompletedMutation.mutate(section.sectionKey);
  };

  const clearAll = (sectionIndex: number) => {
    const section = sections[sectionIndex];
    clearAllMutation.mutate(section.sectionKey);
  };

  if (isLoading) {
    return (
      <div className="w-full h-full p-6 bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading tasks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full p-6 bg-background flex items-center justify-center">
        <div className="text-destructive">
          Error loading tasks: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </div>
    );
  }

  const getDateRangeDisplay = (task: TaskData) => {
    const startDate = formatDate(task.start_date);
    const endDate = formatDate(task.end_date);

    if (!startDate && !endDate) return null;

    if (startDate && endDate && startDate !== endDate) {
      return `${startDate} - ${endDate}`;
    }

    return startDate || endDate;
  };

  const getTimeRangeDisplay = (task: TaskData) => {
    const startTime = formatTime(task.start_time);
    const endTime = formatTime(task.end_time);

    if (!startTime && !endTime) return null;

    if (startTime && endTime) {
      return `${startTime} - ${endTime}`;
    }

    return startTime || endTime;
  };

  return (
    <>
      <div className="w-full h-full p-6 bg-background">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
          {sections.map((section, sectionIndex) => (
            <Card key={section.title} className="flex flex-col h-fit min-h-[400px]">
              <CardHeader className="pb-4 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">
                    {section.title}
                    <span className="ml-2 text-sm text-muted-foreground">
                      ({section.tasks.length})
                    </span>
                  </CardTitle>

                  <div className="flex items-center gap-2">
                    {/* Add Task Sorting Component */}
                    <CompactTaskSorting
                      key={section.sectionKey}
                      tasks={section.sectionKey === 'daily' ? filteredDailyTasks :
                        section.sectionKey === 'today' ? todayTasksWithRecurring.filter(task => task.section !== 'daily') :
                          [...filteredUpcomingTasks.filter(task => task.section !== 'daily'), ...filteredUpcomingRecurringTasks]
                      }
                      onTasksChange={(tasks) => handleTasksSort(section.sectionKey, tasks)}
                      className="mr-2"
                    />

                    {/* Conditional rendering based on section */}
                    {section.sectionKey === 'upcoming' ? (
                      <UpcomingDateFilter
                        onFilterChange={setUpcomingFilter}
                        className=""
                      />
                    ) : (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => clearCompleted(sectionIndex)}
                            disabled={clearCompletedMutation.isPending}
                          >
                            Move completed to trash
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                Move all to trash
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Move all tasks to trash?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will move all tasks in the {section.title.toLowerCase()} section to trash.
                                  You can restore them later if needed.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => clearAll(sectionIndex)}
                                  className="bg-destructive text-destructive-foreground"
                                  disabled={clearAllMutation.isPending}
                                >
                                  Move to Trash
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1">
                {/* Task List */}
                <div className="space-y-2 mb-4">
                  {section.tasks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="text-sm">
                        {section.sectionKey === 'today'
                          ? 'No tasks scheduled for today'
                          : section.sectionKey === 'upcoming'
                            ? 'No upcoming tasks'
                            : 'No daily tasks'
                        }
                      </p>
                    </div>
                  ) : (
                    section.tasks.map((task) => {
                      const dateRange = getDateRangeDisplay(task);
                      const timeRange = getTimeRangeDisplay(task);
                      const recurringPattern = getRecurringPatternDisplay(task);
                      const isInstance = isRecurringInstance(task);

                      return (
                        <div
                          key={task.id}
                          className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                        >
                          {/* Checkbox */}
                          <button
                            onClick={() => toggleTask(task.id)}
                            disabled={updateTaskMutation.isPending}
                            className="flex-shrink-0"
                          >
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${task.completed
                              ? 'bg-primary border-primary text-primary-foreground'
                              : 'border-muted-foreground hover:border-primary'
                              }`}>
                              {task.completed && <span className="text-xs">✓</span>}
                            </div>
                          </button>

                          {/* Task Content */}
                          <div className="flex-1 min-w-0">
                            {/* Task Title - Clickable to expand/collapse description */}
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-medium text-sm cursor-pointer hover:text-primary transition-colors ${task.completed ? 'line-through text-muted-foreground hover:text-muted-foreground/80' : ''
                                  } ${task.description ? 'select-none' : ''}`}
                                onClick={() => task.description && toggleTaskExpansion(task.id)}
                                title={task.description ? (expandedTask === task.id ? "Click to collapse description" : "Click to expand description") : undefined}
                              >
                                {task.title}
                              </span>

                              {/* Recurring badge for instances */}
                              {isInstance && (
                                <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-xs">
                                  Recurring
                                </span>
                              )}
                            </div>

                            {/* Task Details Row */}
                            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                              {/* Priority */}
                              {task.priority && (
                                <span className={`px-2 py-0.5 rounded-full font-medium ${task.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                                  task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                                    'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                  }`}>
                                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                </span>
                              )}

                              {/* Date Range */}
                              {dateRange && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>{dateRange}</span>
                                </div>
                              )}

                              {/* Time Range */}
                              {timeRange && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{timeRange}</span>
                                </div>
                              )}

                              {/* Recurring Pattern */}
                              {!isInstance && task.is_recurring && recurringPattern && (
                                <div className="flex items-center gap-1">
                                  <Repeat className="w-3 h-3" />
                                  <span>{recurringPattern}</span>
                                </div>
                              )}
                            </div>

                            {/* Description (if expanded) */}
                            {expandedTask === task.id && task.description && (
                              <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted/30 rounded">
                                {task.description}
                              </p>
                            )}
                          </div>

                          {/* Task Actions - Always visible now */}
                          <div className="flex items-center gap-1">
                            {/* Edit Task */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(task)}
                              className="h-6 w-6 p-0"
                              title="Edit task"
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>

                            {/* Delete Task */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteTask(task.id)}
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                              disabled={deleteTaskMutation.isPending}
                              title="Delete task"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Edit Task Modal */}
      <EditTaskModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        task={taskToEdit}
        onTaskUpdated={handleTaskUpdated}
      />
    </>
  );
}