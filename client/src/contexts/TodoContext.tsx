'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { todoApi } from '@/lib/api/todos';
import { recurringTodoApi } from '@/lib/api/recurringTodosApi';
import { TaskData } from '@/types/todoTypes';

interface TodoContextType {
  // Original data
  allTasks: TaskData[];
  dailyTasks: TaskData[];
  todayTasks: TaskData[];
  upcomingTasks: TaskData[];
  
  // Enhanced with recurring task instances
  todayTasksWithRecurring: TaskData[];
  upcomingTasksWithRecurring: TaskData[];
  
  // Loading states
  isLoading: boolean;
  isLoadingTodayRecurring: boolean;
  isLoadingUpcomingRecurring: boolean;
  error: Error | null;
  
  // Actions
  refetch: () => void;
  refetchTodayRecurring: () => void;
  refetchUpcomingRecurring: () => void;
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
    staleTime: 1000 * 60 * 5, // 5 minutes
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
    staleTime: 1000 * 60 * 2, // 2 minutes (more frequent for today's tasks)
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

  // Separate tasks by section (original logic for non-recurring tasks)
  const dailyTasks = allTasks.filter(task => task.section === 'daily');
  
  const todayTasks = allTasks.filter(task => {
    if (task.section !== 'today') return false;
    if (task.is_recurring) return false; // Recurring tasks handled by separate query
    
    const today = new Date().toISOString().split('T')[0];
    return !task.start_date || task.start_date === today;
  });
  
  const upcomingTasks = allTasks.filter(task => {
    if (task.section !== 'upcoming') return false;
    if (task.is_recurring) return false; // Recurring tasks handled by separate query
    
    const today = new Date().toISOString().split('T')[0];
    return !task.start_date || task.start_date > today;
  });

  // Auto-reset daily tasks at midnight
  useEffect(() => {
    const checkForNewDay = () => {
      const now = new Date();
      const lastCheck = localStorage.getItem('lastDailyTaskCheck');
      const today = now.toISOString().split('T')[0];
      
      if (lastCheck !== today) {
        // New day detected, reset daily tasks
        todoApi.resetDailyTasks().then(() => {
          // Refetch all queries since it's a new day
          refetch();
          refetchTodayRecurring();
          refetchUpcomingRecurring();
          localStorage.setItem('lastDailyTaskCheck', today);
        }).catch(console.error);
      }
    };

    // Check immediately
    checkForNewDay();
    
    // Set up interval to check every minute
    const interval = setInterval(checkForNewDay, 60000);
    
    return () => clearInterval(interval);
  }, [refetch, refetchTodayRecurring, refetchUpcomingRecurring]);

  const value: TodoContextType = {
    // Original data
    allTasks,
    dailyTasks,
    todayTasks,
    upcomingTasks,
    
    // Enhanced with recurring instances (now from server)
    todayTasksWithRecurring,
    upcomingTasksWithRecurring,
    
    // Loading states
    isLoading,
    isLoadingTodayRecurring,
    isLoadingUpcomingRecurring,
    error: error as Error | null,
    
    // Actions
    refetch,
    refetchTodayRecurring,
    refetchUpcomingRecurring,
  };

  return <TodoContext.Provider value={value}>{children}</TodoContext.Provider>;
};