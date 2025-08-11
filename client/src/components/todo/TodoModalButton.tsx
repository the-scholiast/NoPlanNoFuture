'use client'

import React, { useState, useMemo } from 'react';
import { CheckSquare, Check, Calendar, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TaskData } from '@/types/todoTypes';
import { useTodo } from '@/contexts/TodoContext';
import { useTodoMutations } from '@/components/todo/shared/hooks';
import { getTodayString, parseToLocalDate } from '@/lib/utils/dateUtils';
import { shouldTaskAppearOnDate } from '@/lib/utils/recurringDatesUtils';
import {
  formatDate,
  formatTime,
  getSectionLabel,
  getPriorityColor,
  isRecurringInstance,
  getDateRangeDisplay,
  getTimeRangeDisplay,
  combineAllTasks,
} from '@/components/todo/shared';

export default function TodoModalButton() {
  const [isOpen, setIsOpen] = useState(false);

  // Use the TodoContext for data
  const {
    dailyTasks,
    todayTasksWithRecurring,
    upcomingTasksWithRecurring,
    upcomingTasks,
    isLoading: loading,
    error
  } = useTodo();

  // Use the shared mutations hook
  const { toggleTaskFunction } = useTodoMutations();

  // Get current date and day for filtering (same as useTodoBoard)
  const currentDate = useMemo(() => getTodayString(), []);
  const currentDayOfWeek = useMemo(() => {
    const today = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return dayNames[today.getDay()];
  }, []);

  // Apply the same date filtering logic from useTodoBoard with current day filtering
  const filteredDailyTasks = useMemo(() => {
    const filtered = dailyTasks.filter(task => {
      // For recurring tasks, check if they should appear today (like useTodoBoard)
      if (task.is_recurring && task.recurring_days && task.recurring_days.length > 0) {
        // First check if task should appear based on recurring schedule
        const today = new Date();
        if (!shouldTaskAppearOnDate(task, today)) {
          return false;
        }
      }

      // Apply date range filtering (same as useTodoBoard)
      if (!task.start_date && !task.end_date) return true;
      if (task.start_date && !task.end_date) return task.start_date >= currentDate;
      if (!task.start_date && task.end_date) return currentDate <= task.end_date;
      if (task.start_date && task.end_date) {
        return currentDate >= task.start_date && currentDate <= task.end_date;
      }

      return true;
    });

    // Sort with time priority: incomplete tasks with time first, then without time, then completed
    return filtered.sort((a, b) => {
      // First, sort by completion status (incomplete tasks first)
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }

      // For incomplete tasks, prioritize by time first, then by date/time presence
      const aHasTime = !!(a.start_time || a.end_time);
      const bHasTime = !!(b.start_time || b.end_time);
      
      // If one has time and other doesn't, prioritize the one with time
      if (aHasTime !== bHasTime) {
        return aHasTime ? -1 : 1; // Tasks with time first
      }

      // If both have times, sort by start_time ascending
      if (aHasTime && bHasTime) {
        const timeA = a.start_time || '';
        const timeB = b.start_time || '';
        
        if (timeA && timeB) {
          return timeA.localeCompare(timeB);
        }
        
        if (timeA && !timeB) return -1;
        if (!timeA && timeB) return 1;
      }

      // For tasks without time, check for date/time presence
      const aHasDateTime = !!(a.start_date || a.end_date || a.start_time || a.end_time);
      const bHasDateTime = !!(b.start_date || b.end_date || b.start_time || b.end_time);

      if (aHasDateTime !== bHasDateTime) {
        return aHasDateTime ? -1 : 1; // Tasks with date/time first
      }

      // If both have same date/time status, sort by date then time
      const dateA = a.start_date || a.created_at?.split('T')[0] || '';
      const dateB = b.start_date || b.created_at?.split('T')[0] || '';

      const dateObjA = dateA ? parseToLocalDate(dateA.split('T')[0]) : new Date(0);
      const dateObjB = dateB ? parseToLocalDate(dateB.split('T')[0]) : new Date(0);

      if (dateObjA.getTime() !== dateObjB.getTime()) {
        return dateObjA.getTime() - dateObjB.getTime();
      }

      return a.title.localeCompare(b.title);
    });
  }, [dailyTasks, currentDate, currentDayOfWeek]);

  // Apply the same sorting logic from useTodoBoard to upcoming tasks with custom sorting
  const filteredUpcomingTasks = useMemo(() => {
    return upcomingTasks.sort((a, b) => {
      // First, sort by completion status (incomplete tasks first)
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }

      // For incomplete tasks, prioritize those with dates/times first
      const aHasDateTime = !!(a.start_date || a.end_date || a.start_time || a.end_time);
      const bHasDateTime = !!(b.start_date || b.end_date || b.start_time || b.end_time);

      if (aHasDateTime !== bHasDateTime) {
        return aHasDateTime ? -1 : 1; // Tasks with date/time first
      }

      // If both have same date/time status, sort by date then time
      const dateA = a.start_date || a.created_at?.split('T')[0] || '';
      const dateB = b.start_date || b.created_at?.split('T')[0] || '';

      const dateObjA = dateA ? parseToLocalDate(dateA.split('T')[0]) : new Date(0);
      const dateObjB = dateB ? parseToLocalDate(dateB.split('T')[0]) : new Date(0);

      if (dateObjA.getTime() !== dateObjB.getTime()) {
        return dateObjA.getTime() - dateObjB.getTime();
      }

      const timeA = a.start_time || '';
      const timeB = b.start_time || '';

      if (timeA && timeB) {
        return timeA.localeCompare(timeB);
      }

      if (timeA && !timeB) return -1;
      if (!timeA && timeB) return 1;

      return a.title.localeCompare(b.title);
    });
  }, [upcomingTasks]);

  // Apply the same sorting to upcoming recurring tasks with custom sorting
  const filteredUpcomingRecurringTasks = useMemo(() => {
    return upcomingTasksWithRecurring
      .filter(task => task.section !== 'daily')
      .sort((a, b) => {
        // First, sort by completion status (incomplete tasks first)
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }

        // For incomplete tasks, prioritize those with dates/times first
        const aHasDateTime = !!(a.start_date || a.end_date || a.start_time || a.end_time);
        const bHasDateTime = !!(b.start_date || b.end_date || b.start_time || b.end_time);

        if (aHasDateTime !== bHasDateTime) {
          return aHasDateTime ? -1 : 1; // Tasks with date/time first
        }

        // If both have same date/time status, sort by date then time
        const dateA = a.start_date || a.created_at?.split('T')[0] || '';
        const dateB = b.start_date || b.created_at?.split('T')[0] || '';

        const dateObjA = dateA ? parseToLocalDate(dateA.split('T')[0]) : new Date(0);
        const dateObjB = dateB ? parseToLocalDate(dateB.split('T')[0]) : new Date(0);

        if (dateObjA.getTime() !== dateObjB.getTime()) {
          return dateObjA.getTime() - dateObjB.getTime();
        }

        const timeA = a.start_time || '';
        const timeB = b.start_time || '';

        if (timeA && timeB) {
          return timeA.localeCompare(timeB);
        }

        if (timeA && !timeB) return -1;
        if (!timeA && timeB) return 1;

        return a.title.localeCompare(b.title);
      });
  }, [upcomingTasksWithRecurring]);

  // Group tasks by section with proper filtering and sorting
  const groupedTasks = useMemo(() => {
    // Apply the same sorting logic to today tasks
    const todayTasks = todayTasksWithRecurring
      .filter(task => task.section !== 'daily')
      .sort((a, b) => {
        // First, sort by completion status (incomplete tasks first)
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }

        // For incomplete tasks, prioritize those without dates/times
        const aHasDateTime = !!(a.start_date || a.end_date || a.start_time || a.end_time);
        const bHasDateTime = !!(b.start_date || b.end_date || b.start_time || b.end_time);

        if (aHasDateTime !== bHasDateTime) {
          return bHasDateTime ? -1 : 1; // Tasks without date/time first
        }

        // If both have same date/time status, sort by date then time
        const dateA = a.start_date || a.created_at?.split('T')[0] || '';
        const dateB = b.start_date || b.created_at?.split('T')[0] || '';

        const dateObjA = dateA ? parseToLocalDate(dateA.split('T')[0]) : new Date(0);
        const dateObjB = dateB ? parseToLocalDate(dateB.split('T')[0]) : new Date(0);

        if (dateObjA.getTime() !== dateObjB.getTime()) {
          return dateObjA.getTime() - dateObjB.getTime();
        }

        const timeA = a.start_time || '';
        const timeB = b.start_time || '';

        if (timeA && timeB) {
          return timeA.localeCompare(timeB);
        }

        if (timeA && !timeB) return -1;
        if (!timeA && timeB) return 1;

        return a.title.localeCompare(b.title);
      });

    const upcomingCombined = [
      ...filteredUpcomingTasks.filter(task => task.section !== 'daily'),
      ...filteredUpcomingRecurringTasks
    ];

    return {
      today: todayTasks,
      daily: filteredDailyTasks,
      upcoming: upcomingCombined
    };
  }, [filteredDailyTasks, todayTasksWithRecurring, filteredUpcomingTasks, filteredUpcomingRecurringTasks]);

  // Toggle task completion using the proper function with combined tasks
  const toggleTask = (taskId: string) => {
    const allTasks = combineAllTasks(
      filteredDailyTasks,
      todayTasksWithRecurring,
      filteredUpcomingTasks,
      filteredUpcomingRecurringTasks
    );
    toggleTaskFunction(taskId, allTasks, isRecurringInstance);
  };

  // Use the decomposed function for priority colors with updated logic
  const getPriorityColorForModal = (priority?: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-yellow-500';
      case 'low': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getSectionTitle = (sectionKey: string) => {
    return getSectionLabel(sectionKey);
  };

  const getSectionEmoji = (sectionKey: string) => {
    switch (sectionKey) {
      case 'today': return '📅';
      case 'daily': return '🔄';
      case 'upcoming': return '⏳';
      default: return '📋';
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        size="icon"
        variant="outline"
        className="h-8 w-8"
      >
        <CheckSquare className="h-4 w-4" />
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsOpen(false)}
          />

          {/* Modal positioned in top right */}
          <div className="absolute top-4 right-4 bg-white dark:bg-gray-900 rounded-lg shadow-xl w-96 max-h-[calc(100vh-2rem)] overflow-hidden">
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
            <div className="p-6 overflow-y-auto max-h-[calc(100vh-12rem)]">
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
                                        <span className={`font-medium ${getPriorityColorForModal(task.priority)}`}>
                                          {task.priority.toUpperCase()}
                                        </span>
                                      )}

                                      {/* Use decomposed date range function */}
                                      {getDateRangeDisplay(task) && (
                                        <div className="flex items-center gap-1">
                                          <Calendar className="w-3 h-3" />
                                          <span>{getDateRangeDisplay(task)}</span>
                                        </div>
                                      )}

                                      {/* Use decomposed time range function */}
                                      {getTimeRangeDisplay(task) && (
                                        <div className="flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          <span>{getTimeRangeDisplay(task)}</span>
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
      )}
    </>
  );
}