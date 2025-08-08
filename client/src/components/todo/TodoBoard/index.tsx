"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Settings, Trash2, Edit3, MoreVertical, Calendar, Clock, Repeat, AlertCircle, ChevronDown, ChevronUp, } from 'lucide-react';
import { useTodoBoard } from './hooks/useTodoBoard';
import EditTaskModal from '../EditTaskModal';
import UpcomingDateFilter from '../UpcomingDateFilter';
import { CompactTaskSorting } from '../TaskSortingComponent';
import { TodoBoardProps } from '../shared/types';

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
                      const recurringPattern = getRecurringPatternDisplay(task);
                      const isInstance = isRecurringInstance(task);

                      return (
                        <div
                          key={task.id}
                          className="group p-3 border border-border rounded-lg bg-card hover:bg-accent/50 transition-all duration-200 cursor-pointer"
                        >
                          <div className="flex items-start gap-3">
                            {/* Checkbox */}
                            <div className="flex-shrink-0 mt-0.5">
                              <input
                                type="checkbox"
                                checked={task.completed}
                                onChange={() => toggleTask(task.id)}
                                className="h-4 w-4 rounded border-border"
                              />
                            </div>

                            {/* Task Content */}
                            <div className="flex-1 min-w-0 space-y-1">
                              {/* Task Title and Expansion Toggle */}
                              <div className="flex items-center gap-2">
                                <span
                                  className={`font-medium text-sm break-words flex-1 ${task.completed ? 'line-through text-muted-foreground' : ''
                                    }`}
                                  onClick={() => toggleTaskExpansion(task.id)}
                                >
                                  {task.title}
                                </span>
                              </div>

                              {/* Date/Time Info - Always visible if present */}
                              {(task.start_date || task.end_date || task.start_time || task.end_time) && (
                                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                  {/* Date Range */}
                                  {(task.start_date || task.end_date) && (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      <span>{getDateRangeDisplay(task.start_date, task.end_date, task)}</span>
                                    </div>
                                  )}

                                  {/* Time Range */}
                                  {(task.start_time || task.end_time) && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      <span>{getTimeRangeDisplay(task.start_time, task.end_time, task)}</span>
                                    </div>
                                  )}

                                  {/* Recurring Pattern */}
                                  {!isInstance && task.is_recurring && (
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

                            {/* Action Buttons - Always Visible */}
                            <div className="flex items-center gap-1 ml-auto">
                              {/* Edit Button */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                                onClick={() => openEditModal(task)}
                                title={isInstance ? 'Edit Pattern' : 'Edit'}
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>

                              {/* Delete Button */}
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                    title={isInstance ? 'Remove Pattern' : 'Move to Trash'}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      {isInstance ? 'Remove Recurring Pattern?' : 'Move Task to Trash?'}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {isInstance
                                        ? 'This will remove the entire recurring pattern. This action cannot be undone.'
                                        : 'This task will be moved to trash and can be restored later.'
                                      }
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteTask(task.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      {isInstance ? 'Remove Pattern' : 'Move to Trash'}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
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