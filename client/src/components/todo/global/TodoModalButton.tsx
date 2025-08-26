'use client'

import React, { useState, useMemo } from 'react';
import { CheckSquare, Check, Calendar, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { todoApi } from '@/lib/api/todos';
import { recurringTodoApi } from '@/lib/api/recurringTodosApi';
import { todoKeys } from '@/lib/queryKeys';
import { useTodoMutations } from '@/components/todo/';
import { getTodayString } from '@/lib/utils/dateUtils';
import { getSectionLabel, isRecurringInstance, getDateRangeDisplay, getTimeRangeDisplay, } from '@/components/todo/shared';
import { filterDailyTasksByDate, hasDateTime, sortTasksByField } from '@/components/todo/shared/utils';

export default function TodoModalButton() {
  const [isOpen, setIsOpen] = useState(false);

  // Direct queries
  const { data: allTasks = [], isLoading } = useQuery({
    queryKey: todoKeys.all,
    queryFn: todoApi.getAll,
  });

  const { data: todayTasksWithRecurring = [] } = useQuery({
    queryKey: todoKeys.today,
    queryFn: recurringTodoApi.getTodayTasks,
  });

  const { data: upcomingTasksWithRecurring = [] } = useQuery({
    queryKey: todoKeys.upcoming,
    queryFn: recurringTodoApi.getUpcomingTasks,
  });

  // Computed tasks from direct queries
  const dailyTasks = useMemo(() =>
    allTasks.filter(task => task.section === 'daily'),
    [allTasks]
  );

  const upcomingTasks = useMemo(() => {
    const today = getTodayString();
    return allTasks.filter(task => {
      if (task.section !== 'upcoming') return false;
      if (task.is_recurring) return false;
      return !task.start_date || task.start_date > today;
    });
  }, [allTasks]);

  // Use the shared mutations hook
  const { toggleTaskFunction } = useTodoMutations();

  // Get current date for filtering
  const currentDate = useMemo(() => getTodayString(), []);

  // Apply date filtering and time-first sorting using existing utilities
  const filteredDailyTasks = useMemo(() => {
    const filtered = filterDailyTasksByDate(dailyTasks, currentDate, false);
    return sortTasksByField(filtered, 'start_time');
  }, [dailyTasks, currentDate]);

  // Apply sorting using existing utility
  const filteredUpcomingTasks = useMemo(() => {
    return sortTasksByField(upcomingTasks, 'start_date');
  }, [upcomingTasks]);

  // Apply sorting to upcoming recurring tasks using existing utility
  const filteredUpcomingRecurringTasks = useMemo(() => {
    const filtered = upcomingTasksWithRecurring.filter(task => task.section !== 'daily');
    return sortTasksByField(filtered, 'start_date');
  }, [upcomingTasksWithRecurring]);

  // Group tasks by section with proper filtering and sorting
  const groupedTasks = useMemo(() => {
    // Apply sorting to today tasks using existing utility
    const todayTasks = todayTasksWithRecurring
      .filter(task => task.section !== 'daily' && task.section !== 'none')
      .sort((a, b) => {
        // Custom sorting for today tasks (prioritize tasks without dates/times)
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }

        const aHasDateTime = hasDateTime(a);
        const bHasDateTime = hasDateTime(b);

        if (aHasDateTime !== bHasDateTime) {
          return bHasDateTime ? -1 : 1; // Tasks without date/time first
        }

        // Use existing sorting for the rest
        return sortTasksByField([a, b], 'start_time')[0] === a ? -1 : 1;
      });

    return {
      daily: filteredDailyTasks,
      today: todayTasks,
      upcoming: [
        ...filteredUpcomingTasks.filter(task => task.section !== 'daily' && task.section !== 'none'),
        ...filteredUpcomingRecurringTasks
      ]
    };
  }, [filteredDailyTasks, todayTasksWithRecurring, filteredUpcomingTasks, filteredUpcomingRecurringTasks]);

  // Handle task toggle
  const handleToggle = (taskId: string) => {
    // Get fresh task data
    const allCurrentTasks = [
      ...allTasks,
      ...todayTasksWithRecurring,
      ...upcomingTasksWithRecurring
    ];

    toggleTaskFunction(taskId, allCurrentTasks, isRecurringInstance);
  };

  // Show loading state
  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <CheckSquare className="w-4 h-4 mr-2" />
        Loading...
      </Button>
    );
  }

  // Count incomplete tasks
  const incompleteCounts = {
    daily: groupedTasks.daily.filter(task => !task.completed).length,
    today: groupedTasks.today.filter(task => !task.completed).length,
    upcoming: groupedTasks.upcoming.filter(task => !task.completed).length
  };

  const totalIncomplete = incompleteCounts.daily + incompleteCounts.today + incompleteCounts.upcoming;

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <CheckSquare className="w-4 h-4 mr-2" />
        Tasks
        {totalIncomplete > 0 && (
          <Badge variant="destructive" className="ml-2 px-2 py-0.5 text-xs">
            {totalIncomplete}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-sm">Quick Tasks</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="p-1 h-auto"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="max-h-[600px] overflow-y-auto">
            {['daily', 'today', 'upcoming'].map(section => (
              <div key={section} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
                <div className="p-3 bg-gray-50 dark:bg-gray-750">
                  <h4 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    {getSectionLabel(section)} ({incompleteCounts[section as keyof typeof incompleteCounts]})
                  </h4>
                </div>

                <div className="p-2 space-y-1">
                  {groupedTasks[section as keyof typeof groupedTasks]
                    .filter(task => !task.completed)
                    .map(task => (
                      <div
                        key={task.id}
                        className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <button
                          onClick={() => handleToggle(task.id)}
                          className="flex-shrink-0 w-4 h-4 border border-gray-300 dark:border-gray-600 rounded hover:border-blue-500 transition-colors"
                        >
                          {task.completed && (
                            <Check className="w-3 h-3 text-green-600" />
                          )}
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {task.title}
                          </div>

                          <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                            {task.start_date && (
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>{getDateRangeDisplay(task)}</span>
                              </div>
                            )}
                            {task.start_time && (
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{getTimeRangeDisplay(task)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                  {groupedTasks[section as keyof typeof groupedTasks].filter(task => !task.completed).length === 0 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                      No incomplete tasks
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}