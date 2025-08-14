'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { todoApi } from '@/lib/api/todos';
import { recurringTodoApi } from '@/lib/api/recurringTodosApi';
import { todoCompletionsApi } from '@/lib/api/todoCompletions';
import { TaskData } from '@/types/todoTypes';
import { getTodayString } from '@/lib/utils/dateUtils';

interface TodoContextType {
  allTasks: TaskData[];
  dailyTasks: TaskData[];
  todayTasks: TaskData[];
  upcomingTasks: TaskData[];
  todayTasksWithRecurring: TaskData[];
  upcomingTasksWithRecurring: TaskData[];
  completedTasks: any[];
  // Loading states
  isLoading: boolean;
  isLoadingTodayRecurring: boolean;
  isLoadingUpcomingRecurring: boolean;
  isLoadingCompletedTasks: boolean; 
  error: Error | null;
  // Actions
  refetch: () => void;
  refetchTodayRecurring: () => void;
  refetchUpcomingRecurring: () => void;
  refetchCompletedTasks: () => void; 
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

export const useTodo = () => {
  const context = useContext(TodoContext);
  if (context === undefined) {
    throw new Error('useTodo must be used within a TodoProvider');
  }
  return context;
};

interface TodoProviderProps {
  children: React.ReactNode;
}

export const TodoProvider: React.FC<TodoProviderProps> = ({ children }) => {
  // Main query for all tasks
  const { 
    data: allTasks = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['todos'],
    queryFn: todoApi.getAll,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Query for today's tasks with recurring instances (from server)
  const {
    data: todayTasksWithRecurring = [],
    isLoading: isLoadingTodayRecurring,
    refetch: refetchTodayRecurring
  } = useQuery({
    queryKey: ['recurring-todos', 'today'],
    queryFn: recurringTodoApi.getTodayTasks,
    staleTime: 0,
    refetchOnWindowFocus: true,
    // Only fetch if we have loaded the main tasks
    enabled: !isLoading && allTasks.length >= 0,
  });

  // Query for upcoming tasks with recurring instances (from server)
  const {
    data: upcomingTasksWithRecurring = [],
    isLoading: isLoadingUpcomingRecurring,
    refetch: refetchUpcomingRecurring
  } = useQuery({
    queryKey: ['recurring-todos', 'upcoming'],
    queryFn: recurringTodoApi.getUpcomingTasks,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
    // Only fetch if we have loaded the main tasks
    enabled: !isLoading && allTasks.length >= 0,
  });

  // Query for completed tasks
  const {
    data: completedTasks = [],
    isLoading: isLoadingCompletedTasks,
    refetch: refetchCompletedTasks
  } = useQuery({
    queryKey: ['completed-tasks-context'],
    queryFn: () => todoCompletionsApi.getCompletedTasks(),
    staleTime: 0, // Always consider stale for immediate updates
    refetchOnWindowFocus: true,
    refetchInterval: false,
  });

  // Separate tasks by section (original logic for non-recurring tasks)
  const dailyTasks = allTasks.filter(task => task.section === 'daily');
  
  const todayTasks = allTasks.filter(task => {
    if (task.section !== 'today') return false;
    if (task.is_recurring) return false; // Recurring tasks handled by separate query
    
    const today = getTodayString();
    return !task.start_date || task.start_date === today;
  });
  
  const upcomingTasks = allTasks.filter(task => {
    if (task.section !== 'upcoming') return false;
    if (task.is_recurring) return false; // Recurring tasks handled by separate query
    
    const today = getTodayString();
    return !task.start_date || task.start_date > today;
  });

  // Auto-reset daily tasks at midnight
  useEffect(() => {
    const checkForNewDay = () => {
      const now = new Date();
      const lastCheck = localStorage.getItem('lastDailyTaskCheck');
      const today = getTodayString();
      
      if (lastCheck !== today) {
        // New day detected, reset daily tasks
        todoApi.resetDailyTasks().then(() => {
          // Refetch all queries since it's a new day
          refetch();
          refetchTodayRecurring();
          refetchUpcomingRecurring();
          refetchCompletedTasks(); 
          localStorage.setItem('lastDailyTaskCheck', today);
        }).catch(console.error);
      }
    };

    // Check immediately
    checkForNewDay();
    
    // Set up interval to check every minute
    const interval = setInterval(checkForNewDay, 60000);
    
    return () => clearInterval(interval);
  }, [refetch, refetchTodayRecurring, refetchUpcomingRecurring, refetchCompletedTasks]);

  const value: TodoContextType = {
    allTasks,
    dailyTasks,
    todayTasks,
    upcomingTasks,
    todayTasksWithRecurring,
    upcomingTasksWithRecurring,
    completedTasks,
    
    // Loading states
    isLoading,
    isLoadingTodayRecurring,
    isLoadingUpcomingRecurring,
    isLoadingCompletedTasks, 
    error: error as Error | null,
    
    // Actions
    refetch,
    refetchTodayRecurring,
    refetchUpcomingRecurring,
    refetchCompletedTasks, 
  };

  return <TodoContext.Provider value={value}>{children}</TodoContext.Provider>;
};