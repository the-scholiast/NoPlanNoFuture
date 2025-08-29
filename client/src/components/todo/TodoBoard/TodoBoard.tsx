"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTodoBoard } from './hooks/useTodoBoard';
import EditTaskModal from '../EditTaskModal';
import UpcomingDateFilter from './components/UpcomingDateFilter';
import { useTodoMutations } from '../shared/';
import { CompactTaskSorting } from '../shared/components/TaskSortingComponent';
import { DailyTaskToggle } from '@/components/todo/TodoBoard/components/DailyTaskToggle';
import TaskCard from '../shared/components/TaskCard';

export default function TodoBoard() {
  const {
    sections,
    getAllCurrentTasks,
    expandedTask,
    editModalOpen,
    setEditModalOpen,
    taskToEdit,
    setUpcomingFilter,
    showAllDailyTasks,
    openEditModal,
    handleTasksSort,
    deleteTask,
    toggleTaskExpansion,
    toggleShowAllDailyTasks,
    getDateRangeDisplay,
    getTimeRangeDisplay,
    isRecurringInstance,
    getRecurringPatternDisplay,
    isLoading,
    error,
  } = useTodoBoard();

  // Use shared mutations for all task operations
  const { toggleTaskFunction } = useTodoMutations();

  const handleTaskUpdated = () => {
    // Mutations will automatically invalidate and refetch
  };

  // Simplified toggle function
  const toggleTask = (taskId: string) => {
    // Get fresh task data directly from the hook
    const allCurrentTasks = getAllCurrentTasks();
    const task = allCurrentTasks.find(t => t.id === taskId);

    if (!task) {
      console.error('Task not found:', taskId, 'Available tasks:', allCurrentTasks.map(t => t.id));
      return;
    }

    toggleTaskFunction(taskId, allCurrentTasks, isRecurringInstance);
  };

  if (isLoading) {
    return (
      <div className="w-full h-full bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading tasks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full bg-background flex items-center justify-center">
        <div className="text-destructive">
          Error loading tasks: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full h-full bg-background">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
          {sections.map((section) => (
            <Card key={section.title} className="flex flex-col h-fit min-h-[400px]">
              <CardHeader className="pb-4 border-b">
                <div className="flex flex-col [@media(min-width:1600px)]:flex-row [@media(min-width:1600px)]:items-center [@media(min-width:1600px)]:justify-between gap-3">
                  <CardTitle className="text-lg font-semibold flex-shrink-0">
                    {section.title}
                    <span className="ml-2 text-sm text-muted-foreground">
                      ({section.tasks.length})
                    </span>
                  </CardTitle>

                  <div className="flex items-center gap-2 flex-wrap [@media(min-width:1600px)]:flex-nowrap">
                    <CompactTaskSorting
                      key={section.sectionKey}
                      tasks={section.tasks}
                      onSortChange={(field, order) => handleTasksSort(section.sectionKey, { field, order })}
                      className="flex-shrink-0"
                      defaultSort={section.sectionKey === 'upcoming' ? { field: 'start_date', order: 'asc' } : { field: 'start_time', order: 'asc' }}
                    />

                    {section.sectionKey === 'daily' && (
                      <DailyTaskToggle
                        showAllTasks={showAllDailyTasks}
                        onToggle={toggleShowAllDailyTasks}
                        className="flex-shrink-0"
                      />
                    )}

                    {section.sectionKey === 'upcoming' && (
                      <UpcomingDateFilter
                        onFilterChange={setUpcomingFilter}
                        className="flex-shrink-0"
                      />
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1">
                <div className="p-4">
                  {section.tasks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      {section.sectionKey === 'daily' && !showAllDailyTasks ? (
                        <div>
                          <p className="mb-2">No tasks scheduled for today</p>
                          <p className="text-sm">
                            {`Toggle "All" to see all daily tasks regardless of recurring schedule`}
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

      <EditTaskModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        task={taskToEdit}
        onTaskUpdated={handleTaskUpdated}
      />
    </>
  );
}