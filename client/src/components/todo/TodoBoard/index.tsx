"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Settings, Trash2, Edit3, Calendar, Clock, Repeat, } from 'lucide-react';
import { useTodoBoard } from './hooks/useTodoBoard';
import EditTaskModal from '../EditTaskModal';
import UpcomingDateFilter from '../UpcomingDateFilter';
import { CompactTaskSorting } from '../TaskSortingComponent';
import { TodoBoardProps } from '../shared/types';
import { TaskData } from '@/types/todoTypes';
import { useTodoMutations } from '../shared/hooks/useTodoMutations';
import { DailyTaskToggle } from '@/components/todo/DailyTaskToggle';
import TaskCard from '../TaskCard';

export default function TodoBoard({ onAddTasks }: TodoBoardProps) {
  const {
    sections,
    filteredDailyTasks,
    todayTasksWithRecurring,
    filteredUpcomingTasks,
    filteredUpcomingRecurringTasks,
    showAllDailyTasks,
    expandedTask,
    editModalOpen,
    setEditModalOpen,
    taskToEdit,
    upcomingFilter,
    setUpcomingFilter,
    openEditModal,
    handleTasksSort,
    toggleTaskExpansion,
    toggleShowAllDailyTasks,
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

                    {section.sectionKey === 'daily' && (
                      <DailyTaskToggle
                        showAllTasks={showAllDailyTasks}
                        onToggle={toggleShowAllDailyTasks}
                        className="mr-2"
                      />
                    )}

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
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
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
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Move to trash
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
                <div className="p-4">
                  {section.tasks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {section.sectionKey === 'daily' && !showAllDailyTasks ? (
                        <div>
                          <p className="mb-2">No tasks scheduled for today</p>
                          <p className="text-sm">
                            Toggle "Show All" to see all daily tasks regardless of recurring schedule
                          </p>
                        </div>
                      ) : (
                        <p>No tasks in {section.title.toLowerCase()}</p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {section.tasks.map((task) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          isExpanded={expandedTask === task.id}
                          onToggle={() => toggleTask(task.id)}
                          onExpand={() => toggleTaskExpansion(task.id)}
                          onEdit={() => openEditModal(task)}
                          onDelete={() => deleteTask(task.id)}
                          formatDate={formatDate}
                          formatTime={formatTime}
                          getDateRangeDisplay={getDateRangeDisplay}
                          getTimeRangeDisplay={getTimeRangeDisplay}
                          isRecurringInstance={isRecurringInstance}
                          getRecurringPatternDisplay={getRecurringPatternDisplay}
                        />
                      ))}
                    </div>
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