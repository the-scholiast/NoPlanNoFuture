'use client'

import React, { useState } from 'react';
import { CheckSquare, Check, Calendar, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TaskData } from '@/types/todoTypes';
import { useTodo } from '@/contexts/TodoContext';
import { useTodoMutations } from '@/components/todo/shared/hooks';

export default function TodoModalButton() {
  const [isOpen, setIsOpen] = useState(false);

  // Use the TodoContext for data instead of a separate query
  const {
    dailyTasks,
    todayTasksWithRecurring,
    upcomingTasksWithRecurring,
    upcomingTasks,
    isLoading: loading,
    error
  } = useTodo();

  // Use the shared mutations hook
  const {
    toggleTaskFunction
  } = useTodoMutations();

  // Combine all tasks for the modal
  const allTasks = [
    ...dailyTasks,
    ...todayTasksWithRecurring,
    ...upcomingTasks,
    ...upcomingTasksWithRecurring
  ];

  // Group tasks by section
  const groupedTasks = {
    today: allTasks.filter(task => task.section === 'today'),
    daily: allTasks.filter(task => task.section === 'daily'),
    upcoming: allTasks.filter(task => task.section === 'upcoming')
  };

  // Helper function to check if a task is a recurring instance
  const isRecurringInstance = (task: TaskData): boolean => {
    return Boolean(task.id.includes('_') && task.parent_task_id);
  };

  // Toggle task completion using the proper function
  const toggleTask = (taskId: string) => {
    toggleTaskFunction(taskId, allTasks, isRecurringInstance);
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getSectionTitle = (sectionKey: string) => {
    switch (sectionKey) {
      case 'today': return 'Today';
      case 'daily': return 'Daily';
      case 'upcoming': return 'Upcoming';
      default: return sectionKey;
    }
  };

  const getSectionEmoji = (sectionKey: string) => {
    switch (sectionKey) {
      case 'today': return '📅';
      case 'daily': return '🔄';
      case 'upcoming': return '⏳';
      default: return '📋';
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        size="icon"
        variant="outline"
        className="h-8 w-8"
      >
        <CheckSquare className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => setIsOpen(false)}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">Quick Todo Overview</h2>
          <Button
            onClick={() => setIsOpen(false)}
            size="icon"
            variant="ghost"
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-700 dark:text-red-300 text-sm">
                {error?.message || 'An error occurred'}
              </p>
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
                                  ? 'line-through text-pink-600 dark:text-pink-400'
                                  : 'text-pink-900 dark:text-pink-100'
                                  }`}>
                                  {task.title}
                                </div>

                                {/* Task details */}
                                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-pink-700 dark:text-pink-300">
                                  {task.priority && (
                                    <span className={`font-medium ${getPriorityColor(task.priority)}`}>
                                      {task.priority.toUpperCase()}
                                    </span>
                                  )}

                                  {task.start_date && (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      <span>{new Date(task.start_date).toLocaleDateString()}</span>
                                    </div>
                                  )}

                                  {task.start_time && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      <span>{task.start_time}</span>
                                    </div>
                                  )}

                                  {isRecurringInstance(task) && (
                                    <span className="bg-pink-200 dark:bg-pink-800 text-pink-800 dark:text-pink-200 px-2 py-0.5 rounded text-xs">
                                      Recurring
                                    </span>
                                  )}
                                </div>

                                {/* Description */}
                                {task.description && (
                                  <p className="text-xs text-pink-600 dark:text-pink-400 mt-1 truncate">
                                    {task.description}
                                  </p>
                                )}
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

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Visit the main todo page for full task management features
          </p>
        </div>
      </div>
    </div>
  );
}