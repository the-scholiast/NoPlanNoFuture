"use client"

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { todoApi } from '@/lib/api/todos';
import { TaskData } from '@/types/todoTypes';
import { isToday, isUpcoming, isDailyTask } from '@/lib/utils/dateUtils';

interface TodoContextType {
  allTasks: TaskData[];
  dailyTasks: TaskData[];
  todayTasks: TaskData[];
  upcomingTasks: TaskData[];
  isLoading: boolean;
  error: any;
  refetch: () => void;
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

export const useTodo = () => {
  const context = useContext(TodoContext);
  if (context === undefined) {
    throw new Error('useTodo must be used within a TodoProvider');
  }
  return context;
};

export function TodoProvider({ children }: { children: ReactNode }) {
  // Fetch all tasks
  const {
    data: allTasks = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => todoApi.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  // Dynamic filtering based on dates with Daily task exclusion
  const { dailyTasks, todayTasks, upcomingTasks } = useMemo(() => {
    const incompleteTasks = allTasks.filter(task => !task.completed);
    
    return {
      // Daily tasks: only tasks explicitly assigned to 'daily' section
      dailyTasks: incompleteTasks.filter(task => task.section === 'daily'),
      
      // Today tasks: tasks with today's date BUT exclude daily tasks
      todayTasks: incompleteTasks.filter(task => 
        !isDailyTask(task) && // Exclude daily tasks
        task.start_date && 
        isToday(task.start_date)
      ),
      
      // Upcoming tasks: tasks with future dates BUT exclude daily tasks
      upcomingTasks: incompleteTasks.filter(task => 
        !isDailyTask(task) && // Exclude daily tasks
        task.start_date && 
        isUpcoming(task.start_date)
      )
    };
  }, [allTasks]);

  const value: TodoContextType = {
    allTasks,
    dailyTasks,
    todayTasks,
    upcomingTasks,
    isLoading,
    error,
    refetch
  };

  return (
    <TodoContext.Provider value={value}>
      {children}
    </TodoContext.Provider>
  );
}