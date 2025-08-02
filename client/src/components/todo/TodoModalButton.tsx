'use client'

import React, { useState, useEffect } from 'react';
import { CheckSquare, Check, Calendar, Clock, Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { todoApi } from '@/lib/api/todos';
import { TaskData } from '@/types/todoTypes';

export default function TodoModalButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load tasks when modal opens
  useEffect(() => {
    if (isOpen) {
      loadTasks();
    }
  }, [isOpen]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await todoApi.getAll();
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      setError('Failed to load tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Group tasks by section
  const groupedTasks = {
    today: tasks.filter(task => task.section === 'today'),
    daily: tasks.filter(task => task.section === 'daily'),
    upcoming: tasks.filter(task => task.section === 'upcoming')
  };

  // Toggle task completion
  const toggleTask = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      // Optimistically update the UI
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === taskId ? { ...t, completed: !t.completed } : t
        )
      );

      // Update the backend
      await todoApi.update(taskId, { completed: !task.completed });
    } catch (error) {
      console.error('Failed to update task:', error);
      // Revert the optimistic update on error
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === taskId ? { ...t, completed: !t.completed } : t
        )
      );
      setError('Failed to update task. Please try again.');
    }
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
                {/* Error Display */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setError(null)}
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
                                      className="flex-shrink-0 mt-0.5"
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