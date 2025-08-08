"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TaskData } from '@/types/todoTypes';
import { useTodoBoard } from './hooks/useTodoBoard';
import EditTaskModal from '../EditTaskModal';
import { CompactTaskSorting } from '../TaskSortingComponent';

// Defines the external API for the TodoBoard component
interface TodoBoardProps {
  onAddTasks?: (tasks: TaskData[]) => void;
}

// Main todo management interface
export default function TodoBoard({ onAddTasks }: TodoBoardProps) {
  const {
    sections,            // Fully processed task sections with filtering applied
    editModalOpen,       // Edit modal visibility state
    setEditModalOpen,    // Setter for edit modal visibility
    taskToEdit,          // Currently selected task for editing (with proper ID handling)
    toggleTask,          // Function to toggle task completion (handles recurring tasks)
    openEditModal,       // Function to open edit modal (handles recurring task IDs)
    handleTasksSort,     // Manual task reordering handler
    isLoading,           // Combined loading state from all data sources
    error,               // Any errors from data fetching
  } = useTodoBoard();

  // Integrates with parent component's task tracking
  const handleAddTasks = (newTasks: TaskData[]) => {
    if (onAddTasks) {
      onAddTasks(newTasks);
    }
  };

  // Placeholder for any additional UI updates needed -> Remove if not used!!!
  const handleTaskUpdated = () => {
    // Handled by mutations in the hook
  };

  // Shows loading while any data sources are fetching
  if (isLoading) {
    return (
      <div className="w-full h-full p-6 bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading tasks...</div>
      </div>
    );
  }

  // Handles any errors from data fetching operations
  if (error) {
    return (
      <div className="w-full h-full p-6 bg-background flex items-center justify-center">
        <div className="text-destructive">
          Error loading tasks: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      </div>
    );
  }

  // Main UI render
  return (
    <>
      {/* MAIN TODO BOARD LAYOUT */}
      <div className="w-full h-full p-6 bg-background">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
          {/* SECTION ITERATION */}
          {sections.map((section, sectionIndex) => (
            <Card key={section.title} className="flex flex-col h-fit min-h-[400px]">
              <CardHeader className="pb-4 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">
                    {section.title}
                    {/* Shows live count of tasks in each section */}
                    <span className="ml-2 text-sm text-muted-foreground">
                      ({section.tasks.length})
                    </span>
                  </CardTitle>

                  {/* Section Controls */}
                  <div className="flex items-center gap-2">
                    {/* Task sorting integration */}
                    <CompactTaskSorting
                      key={section.sectionKey}
                      tasks={section.tasks}
                      onTasksChange={(sortedTasks) => handleTasksSort(section.sectionKey, sortedTasks)}
                    />
                  </div>
                </div>
              </CardHeader>

              {/* SECTION CONTENT (TASK LIST) */}
              <CardContent className="flex-1 p-4">
                <div className="space-y-2">
                  {/* Individual task rendering */}
                  {section.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      {/* Task completion checkbox */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleTask(task.id)}
                        className={`h-6 w-6 p-0 ${task.completed ? 'text-green-600' : 'text-muted-foreground'}`}
                      >
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => { }}
                          className="h-4 w-4"
                        />
                      </Button>

                      {/* Task contents */}
                      <div className="flex-1 min-w-0">
                        {/* Task title */}
                        <div className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </div>
                        {/* Task description (if it exists) */}
                        {task.description && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {task.description}
                          </div>
                        )}
                      </div>

                      {/* Task edit button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(task)}
                        className="h-6 w-6 p-0"
                      >
                        ⚙️
                      </Button>
                    </div>
                  ))}
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