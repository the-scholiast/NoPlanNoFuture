"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Settings, Trash2, Edit3, MoreVertical, Calendar, Clock, Repeat, AlertCircle, BarChart3, RefreshCw } from 'lucide-react';
import { TaskData } from '@/types/todoTypes';
import { useTodoBoard } from './hooks/useTodoBoard';
import EditTaskModal from '../EditTaskModal';
import UpcomingDateFilter from '../UpcomingDateFilter';
import { CompactTaskSorting } from '../TaskSortingComponent';

interface TodoBoardProps {
  onAddTasks?: (tasks: TaskData[]) => void;
}

export default function TodoBoard({ onAddTasks }: TodoBoardProps) {
  const {
    sections,
    filteredDailyTasks,
    todayTasksWithRecurring,
    filteredUpcomingTasks,
    expandedTask,
    editModalOpen,
    setEditModalOpen,
    taskToEdit,
    upcomingFilter,
    setUpcomingFilter,
    toggleTask,
    openEditModal,
    handleTasksSort,
    clearCompleted,
    clearAll,
    deleteTask,
    toggleTaskExpansion,
    formatDate,
    formatTime,
    getDateRangeDisplay,
    getTimeRangeDisplay,
    isRecurringInstance,
    getRecurringPatternDisplay,
    isLoading,
    error,
  } = useTodoBoard();

  const handleTaskUpdated = () => {
    // Handled by mutations in the hook
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
                      tasks={section.sectionKey === 'daily' ? filteredDailyTasks : // Use filtered daily tasks
                        section.sectionKey === 'today' ? todayTasksWithRecurring.filter(task => task.section !== 'daily') :
                          filteredUpcomingTasks.filter(task => task.section !== 'daily')}
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
                          className="group flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                        >
                          {/* Checkbox */}
                          <button
                            onClick={() => toggleTask(task.id)}
                            className="flex-shrink-0"
                          >
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${task.completed
                              ? 'bg-primary border-primary'
                              : 'border-muted-foreground hover:border-primary'
                              }`}>
                              {task.completed && (
                                <div className="w-2 h-2 bg-primary-foreground rounded-sm" />
                              )}
                            </div>
                          </button>

                          {/* Task Content */}
                          <div className="flex-1 min-w-0">
                            <div className="space-y-1">
                              <div
                                className={`text-sm font-medium cursor-pointer flex items-center gap-2 ${task.completed ? 'line-through text-muted-foreground' : ''
                                  }`}
                                onClick={() => toggleTaskExpansion(task.id)}
                              >
                                <span>{task.title}</span>
                                {/* Recurring task indicator */}
                                {(task.is_recurring || isInstance) && (
                                  <div title="Recurring task">
                                    <Repeat className="h-3 w-3 text-blue-500" />
                                  </div>
                                )}
                                {/* Recurring instance indicator */}
                                {isInstance && (
                                  <div title="Task instance">
                                    <AlertCircle className="h-3 w-3 text-orange-500" />
                                  </div>
                                )}
                              </div>

                              {/* Date, Time, and Recurring Pattern Display */}
                              {(dateRange || timeRange || recurringPattern) && (
                                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                  {dateRange && (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      <span>{dateRange}</span>
                                    </div>
                                  )}
                                  {timeRange && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      <span>{timeRange}</span>
                                    </div>
                                  )}
                                  {recurringPattern && (
                                    <div className="flex items-center gap-1">
                                      <Repeat className="h-3 w-3" />
                                      <span>{recurringPattern}</span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Task Description - Shows when expanded */}
                              {expandedTask === task.id && task.description && (
                                <div className="text-xs text-muted-foreground mt-1 p-2 bg-muted/30 rounded break-words overflow-hidden">
                                  {task.description}
                                </div>
                              )}

                              {/* Priority Badge */}
                              {task.priority && (
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${task.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                                    task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                                      'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                    }`}>
                                    {task.priority}
                                  </span>
                                </div>
                              )}

                              {/* Recurring Instance Info */}
                              {isInstance && (
                                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                  Instance for {formatDate(task.start_date)}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Menu */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditModal(task)}>
                                <Edit3 className="h-4 w-4 mr-2" />
                                {isInstance ? 'Edit Pattern' : 'Edit'}
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => deleteTask(task.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                {isInstance ? 'Remove Pattern' : 'Move to Trash'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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