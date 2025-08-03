'use client'

import React, { useState } from 'react';
import { CheckSquare, Check, Calendar, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { todoApi } from '@/lib/api/todos';
import { TaskData } from '@/types/todoTypes';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function TodoModalButton() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient(); // Gets access to the cache manager

  // Fetch tasks with useQuery
  const {
    data: tasks = [],
    isLoading: loading,
    error
  } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => todoApi.getAll(),
    enabled: isOpen, // Only run query when modal is open
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });

  // Mutation for toggling task completion
  const toggleTaskMutation = useMutation({
    mutationFn: async ({ taskId, completed }: { taskId: string; completed: boolean }) => {
      return await todoApi.update(taskId, { completed });
    },
    onMutate: async ({ taskId, completed }) => {
      // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData(['tasks']);

      // Optimistically update to the new value
      queryClient.setQueryData(['tasks'], (old: TaskData[] = []) =>
        old.map(task =>
          task.id === taskId ? { ...task, completed } : task
        )
      );

      // Return a context object with the snapshotted value
      return { previousTasks };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
    },
    onSettled: () => {
      // Always refetch after error or success to ensure we have the latest data
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Toggle task completion
  const toggleTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    toggleTaskMutation.mutate({
      taskId,
      completed: !task.completed
    });
  };

  // Group tasks by section
  const groupedTasks = {
    today: tasks.filter(task => task.section === 'today'),
    daily: tasks.filter(task => task.section === 'daily'),
    upcoming: tasks.filter(task => task.section === 'upcoming')
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
      case 'low': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString; // Return original if parsing fails
    }
  };

  const getSectionTitle = (sectionKey: string) => {
    switch (sectionKey) {
      case 'today': return 'Today';
      case 'daily': return 'Daily';
      case 'upcoming': return 'Upcoming';
      default: return sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1);
    }
  };

  const getSectionEmoji = (sectionKey: string) => {
    switch (sectionKey) {
      case 'today': return '📅';
      case 'daily': return '🔄';
      case 'upcoming': return '📋';
      default: return '📝';
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="outline"
        className="h-auto min-h-[50px] w-[90px] flex flex-col gap-2 p-4 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950/30 dark:to-pink-900/20 border-pink-200/50 dark:border-pink-800/30 hover:from-pink-100 hover:to-pink-150 dark:hover:from-pink-950/50 dark:hover:to-pink-900/40"
        onClick={() => setIsOpen(true)}
      >
        <CheckSquare className="h-6 w-6 text-pink-600 dark:text-pink-400" />
        <div className="text-center">
          <div className="font-semibold text-pink-900 dark:text-pink-100">To Do</div>
        </div>
      </Button>

      {/* Custom Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />

          {/* Right Side Panel */}
          <div className="ml-auto relative">
            <div className="h-full w-96 bg-background border-l shadow-lg overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-background border-b p-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-pink-800 bg-clip-text text-transparent">
                  To Do Tasks
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Error Display - handle both query and mutation errors */}
                {(error || toggleTaskMutation.error) && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-700 dark:text-red-300 text-sm">
                      {error?.message || toggleTaskMutation.error?.message || 'An error occurred'}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        toggleTaskMutation.reset(); // Clear mutation error
                      }}
                      className="mt-2"
                    >
                      Dismiss
                    </Button>
                  </div>
                )}

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">Loading tasks...</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(['today', 'daily', 'upcoming'] as const).map((sectionKey) => {
                      const sectionTasks = groupedTasks[sectionKey];
                      const sectionTitle = getSectionTitle(sectionKey);
                      const sectionEmoji = getSectionEmoji(sectionKey);

                      return (
                        <div
                          key={sectionKey}
                          className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950/30 dark:to-pink-900/20 border border-pink-200/50 dark:border-pink-800/30 rounded-lg p-4"
                        >
                          {/* Section Header */}
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-lg text-pink-900 dark:text-pink-100 flex items-center gap-2">
                              <span>{sectionEmoji}</span>
                              {sectionTitle}
                            </h3>
                            {sectionTasks.length > 0 && (
                              <Badge variant="secondary" className="bg-pink-200 text-pink-800 dark:bg-pink-800 dark:text-pink-200">
                                {sectionTasks.filter(t => t.completed).length}/{sectionTasks.length}
                              </Badge>
                            )}
                          </div>

                          {/* Tasks List */}
                          <div className="space-y-3">
                            {sectionTasks.length === 0 ? (
                              <div className="text-center py-6 text-pink-600 dark:text-pink-400">
                                <div className="text-2xl mb-2">{sectionEmoji}</div>
                                <p className="text-sm">No tasks in {sectionTitle.toLowerCase()}</p>
                              </div>
                            ) : (
                              sectionTasks.map((task) => (
                                <div
                                  key={task.id}
                                  className="bg-white/60 dark:bg-pink-950/30 border border-pink-200/50 dark:border-pink-800/30 rounded-lg p-3 hover:bg-white/80 dark:hover:bg-pink-950/50 transition-colors"
                                >
                                  {/* Task header with checkbox and title */}
                                  <div className="flex items-start gap-3">
                                    <button
                                      onClick={() => toggleTask(task.id)}
                                      disabled={toggleTaskMutation.isPending}
                                      className="flex-shrink-0 mt-0.5 disabled:opacity-50"
                                    >
                                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${task.completed
                                        ? 'bg-pink-500 border-pink-500'
                                        : 'border-pink-300 hover:border-pink-500 dark:border-pink-600 dark:hover:border-pink-400'
                                        }`}>
                                        {task.completed && (
                                          <Check className="w-3 h-3 text-white" />
                                        )}
                                      </div>
                                    </button>

                                    <div className="flex-1 min-w-0">
                                      <div className={`font-medium text-sm ${task.completed
                                        ? 'line-through text-muted-foreground'
                                        : 'text-pink-900 dark:text-pink-100'
                                        }`}>
                                        {task.title}
                                      </div>

                                      {/* Task metadata */}
                                      <div className="flex flex-wrap gap-2 mt-2">
                                        {/* Priority badge */}
                                        {task.priority && (
                                          <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                                            {task.priority}
                                          </Badge>
                                        )}

                                        {/* Date information */}
                                        {(task.start_date || task.end_date) && (
                                          <Badge variant="outline" className="text-xs border-pink-300 text-pink-700 dark:border-pink-600 dark:text-pink-300">
                                            <Calendar className="w-3 h-3 mr-1" />
                                            {task.start_date && formatDate(task.start_date)}
                                            {task.start_date && task.end_date && task.start_date !== task.end_date && ' - '}
                                            {task.end_date && task.end_date !== task.start_date && formatDate(task.end_date)}
                                          </Badge>
                                        )}

                                        {/* Time information */}
                                        {(task.start_time || task.end_time) && (
                                          <Badge variant="outline" className="text-xs border-pink-300 text-pink-700 dark:border-pink-600 dark:text-pink-300">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {task.start_time}
                                            {task.start_time && task.end_time && ' - '}
                                            {task.end_time}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}