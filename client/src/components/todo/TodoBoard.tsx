"use client"

import React, { useState } from 'react';
import { Settings, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { TaskData } from '@/types/todoTypes';
import { todoApi } from '@/lib/api/todos';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import EditTaskModal from './EditTaskModal';

// ===== TYPE DEFINITIONS =====
interface TodoSection {
  title: string;
  tasks: TaskData[];
  showAddButton: boolean;
  sectionKey: 'daily' | 'today' | 'upcoming';
}

interface TodoBoardProps {
  onAddTasks?: (tasks: TaskData[]) => void;
}

export default function TodoBoard({ onAddTasks }: TodoBoardProps) {
  const queryClient = useQueryClient();
  
  // State for UI interactions
  const [newTaskInputs, setNewTaskInputs] = useState<{[key: string]: string}>({});
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskData | null>(null);

  // ===== DATA FETCHING =====
  const {
    data: allTasks = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => todoApi.getAll(),
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  const incompleteTasks = allTasks.filter(task => !task.completed);

  // ===== MUTATIONS =====
  
  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: (taskData: { title: string; section: 'daily' | 'today' | 'upcoming' }) => 
      todoApi.create({
        title: taskData.title,
        section: taskData.section,
        priority: 'low' // default priority
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<TaskData> }) =>
      todoApi.update(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData(['tasks']);
      
      queryClient.setQueryData(['tasks'], (old: TaskData[] = []) =>
        old.map(task => task.id === id ? { ...task, ...updates } : task)
      );
      
      return { previousTasks };
    },
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => todoApi.delete(taskId),
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      const previousTasks = queryClient.getQueryData(['tasks']);
      
      queryClient.setQueryData(['tasks'], (old: TaskData[] = []) =>
        old.filter(task => task.id !== taskId)
      );
      
      return { previousTasks };
    },
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Clear completed tasks mutation
  const clearCompletedMutation = useMutation({
    mutationFn: (section: 'daily' | 'today' | 'upcoming') => 
      todoApi.deleteCompleted(section),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Clear all tasks mutation
  const clearAllMutation = useMutation({
    mutationFn: (section: 'daily' | 'today' | 'upcoming') => 
      todoApi.deleteAll(section),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // ===== ORGANIZE TASKS BY SECTION =====
  const sections: TodoSection[] = [
    {
      title: "Daily",
      sectionKey: 'daily',
      tasks: incompleteTasks.filter(task => task.section === 'daily'),
      showAddButton: false
    },
    {
      title: "Today", 
      sectionKey: 'today',
      tasks: incompleteTasks.filter(task => task.section === 'today'),
      showAddButton: false
    },
    {
      title: "Upcoming",
      sectionKey: 'upcoming',
      tasks: incompleteTasks.filter(task => task.section === 'upcoming'),
      showAddButton: false
    }
  ];

  // ===== TASK MANAGEMENT FUNCTIONS =====
  const handleAddTasks = (newTasks: TaskData[]) => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
    
    // Call the optional callback
    if (onAddTasks) {
      onAddTasks(newTasks);
    }
  };

  const addTask = (sectionIndex: number) => {
    const taskTitle = newTaskInputs[sectionIndex] || "";
    if (taskTitle.trim() === "") return;

    const section = sections[sectionIndex];
    createTaskMutation.mutate({
      title: taskTitle.trim(),
      section: section.sectionKey
    });

    // Clear input
    setNewTaskInputs(prev => ({ ...prev, [sectionIndex]: "" }));
  };

  const toggleTask = (taskId: string) => {
    const task = allTasks.find(t => t.id === taskId);
    if (!task) return;

    updateTaskMutation.mutate({
      id: taskId,
      updates: { completed: !task.completed }
    });
  };

  const clearCompleted = (sectionIndex: number) => {
    const section = sections[sectionIndex];
    clearCompletedMutation.mutate(section.sectionKey);
  };

  const clearAll = (sectionIndex: number) => {
    const section = sections[sectionIndex];
    clearAllMutation.mutate(section.sectionKey);
  };

  const deleteTask = (taskId: string) => {
    deleteTaskMutation.mutate(taskId);
  };

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTask(expandedTask === taskId ? null : taskId);
  };

  const openEditModal = (task: TaskData) => {
    setTaskToEdit(task);
    setEditModalOpen(true);
  };

  const handleTaskUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };

  const handleInputKeyPress = (e: React.KeyboardEvent, sectionIndex: number) => {
    if (e.key === 'Enter') {
      addTask(sectionIndex);
    }
  };

  // ===== RENDER =====
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
                      Clear completed
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => clearAll(sectionIndex)}
                      disabled={clearAllMutation.isPending}
                    >
                      Clear all
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>

            <CardContent className="flex-1">
              {/* Task List */}
              <div className="space-y-2 mb-4">
                {section.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="group flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors"
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleTask(task.id)}
                      disabled={updateTaskMutation.isPending}
                      className="flex-shrink-0"
                    >
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                        task.completed 
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
                          className={`text-sm font-medium cursor-pointer ${
                            task.completed ? 'line-through text-muted-foreground' : ''
                          }`}
                          onClick={() => toggleTaskExpansion(task.id)}
                        >
                          {task.title}
                        </div>

                        {/* Task Description - Shows when expanded */}
                        {expandedTask === task.id && task.description && (
                          <div className="text-xs text-muted-foreground mt-1 p-2 bg-muted/30 rounded break-words overflow-hidden">
                            {task.description}
                          </div>
                        )}

                        {/* Priority Badge */}
                        {task.priority && (
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              task.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                              'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                            }`}>
                              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                            </span>
                          </div>
                        )}

                        {/* Date and Time Information */}
                        {(task.start_date || task.end_date || task.start_time || task.end_time) && (
                          <div className="space-y-1">
                            {/* Dates */}
                            {(task.start_date || task.end_date) && (
                              <div className="text-xs text-muted-foreground">
                                📅 {task.start_date && new Date(task.start_date).toLocaleDateString()}
                                {task.start_date && task.end_date && ' - '}
                                {task.end_date && task.end_date !== task.start_date && new Date(task.end_date).toLocaleDateString()}
                              </div>
                            )}

                            {/* Times */}
                            {(task.start_time || task.end_time) && (
                              <div className="text-xs text-muted-foreground">
                                🕐 {task.start_time}
                                {task.start_time && task.end_time && ' - '}
                                {task.end_time}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Task Actions */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={() => openEditModal(task)}
                        disabled={updateTaskMutation.isPending}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteTask(task.id)}
                        disabled={deleteTaskMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Task Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a task..."
                  value={newTaskInputs[sectionIndex] || ""}
                  onChange={(e) => setNewTaskInputs(prev => ({ ...prev, [sectionIndex]: e.target.value }))}
                  onKeyDown={(e) => handleInputKeyPress(e, sectionIndex)}
                  className="text-sm"
                  disabled={createTaskMutation.isPending}
                />
                <Button
                  onClick={() => addTask(sectionIndex)}
                  disabled={createTaskMutation.isPending || !newTaskInputs[sectionIndex]?.trim()}
                  size="sm"
                >
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Task Modal */}
      <EditTaskModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        task={taskToEdit}
        onTaskUpdated={handleTaskUpdated}
      />
    </div>
  );
}