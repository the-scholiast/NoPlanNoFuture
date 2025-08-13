"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTodoBoard } from './hooks/useTodoBoard';
import EditTaskModal from '../EditTaskModal';
import UpcomingDateFilter from './components/UpcomingDateFilter';
import { CompactTaskSorting } from '../shared/components/TaskSortingComponent';
import { TodoBoardProps } from '../shared/types';
import { useTodoMutations } from '../shared/hooks/useTodoMutations';
import { DailyTaskToggle } from '@/components/todo/TodoBoard/components/DailyTaskToggle';
import TaskCard from '../shared/components/TaskCard';
import { combineAllTasks, } from '../shared';
import { useQueryClient } from '@tanstack/react-query';

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
    setUpcomingFilter,
    openEditModal,
    handleTasksSort,
    toggleTaskExpansion,
    toggleShowAllDailyTasks,
    formatDate,
    formatTime,
    isRecurringInstance,
    getRecurringPatternDisplay,
    getDateRangeDisplay,
    getTimeRangeDisplay,
    deleteTask,
    isLoading,
    error,
  } = useTodoBoard();

  // Use shared mutations for all task operations
  const { toggleTaskFunction } = useTodoMutations();

  const queryClient = useQueryClient();

  const handleTaskUpdated = () => {
    // Handled by mutations in the hook
  };

  // Use shared toggle function
  const toggleTask = async (taskId: string) => {
  try {
    console.log('📋 TodoBoard: Toggling task', taskId);
    const allTasks = combineAllTasks(filteredDailyTasks, todayTasksWithRecurring, filteredUpcomingTasks, filteredUpcomingRecurringTasks);
    await toggleTaskFunction(taskId, allTasks, isRecurringInstance);
    
    console.log('📋 TodoBoard: Task toggled, forcing CompletedTasks refresh...');
    
    // Force immediate refetch of completed tasks with multiple attempts
    queryClient.refetchQueries({
      predicate: (query) => query.queryKey[0] === 'completed-tasks'
    });
    
    // Additional force refetch after a short delay to ensure completion records are saved
    setTimeout(() => {
      queryClient.refetchQueries({
        predicate: (query) => query.queryKey[0] === 'completed-tasks'
      });
    }, 200);
    
  } catch (error) {
    console.error('TodoBoard: Error in toggleTask:', error);
  }
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
          {sections.map((section) => (
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
                      tasks={section.tasks}
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
                    {section.sectionKey === 'upcoming' && (
                      <UpcomingDateFilter
                        onFilterChange={setUpcomingFilter}
                        className=""
                      />
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