"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Types
interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  dueDate?: Date;
  priority?: 'low' | 'medium' | 'high';
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
}

interface TaskData {
  id: string;
  task: string;
  section: 'daily' | 'today' | 'upcoming';
  priority: 'low' | 'medium' | 'high';
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  isSelected: boolean;
}

interface TodoContextType {
  dailyTasks: Task[];
  todayTasks: Task[];
  upcomingTasks: Task[];
  addTasks: (tasks: TaskData[]) => void;
  updateTask: (section: 'daily' | 'today' | 'upcoming', taskId: string, updates: Partial<Task>) => void;
  deleteTask: (section: 'daily' | 'today' | 'upcoming', taskId: string) => void;
  clearCompleted: (section: 'daily' | 'today' | 'upcoming') => void;
  clearAll: (section: 'daily' | 'today' | 'upcoming') => void;
}

// Create Context
const TodoContext = createContext<TodoContextType | undefined>(undefined);

// Hook to use the context
export const useTodo = () => {
  const context = useContext(TodoContext);
  if (context === undefined) {
    throw new Error('useTodo must be used within a TodoProvider');
  }
  return context;
};

// Provider component
export function TodoProvider({ children }: { children: ReactNode }) {
  // Placeholder data
  const [dailyTasks, setDailyTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Morning Exercise',
      completed: false,
      createdAt: new Date(),
      priority: 'high',
      startTime: '07:00',
      endTime: '08:00'
    },
    {
      id: '2', 
      title: 'Review Daily Goals',
      completed: true,
      createdAt: new Date(),
      priority: 'medium'
    }
  ]);

  const [todayTasks, setTodayTasks] = useState<Task[]>([
    {
      id: '3',
      title: 'Team Meeting',
      completed: false,
      createdAt: new Date(),
      priority: 'high',
      startDate: new Date().toISOString().split('T')[0],
      startTime: '10:00',
      endTime: '11:00'
    }
  ]);

  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([
    {
      id: '4',
      title: 'Project Deadline',
      completed: false,
      createdAt: new Date(),
      priority: 'high',
      startDate: '2025-02-01',
      endDate: '2025-02-01'
    }
  ]);

  // Helper function to get the correct setter
  const getTaskSetter = (section: 'daily' | 'today' | 'upcoming') => {
    switch (section) {
      case 'daily': return setDailyTasks;
      case 'today': return setTodayTasks;
      case 'upcoming': return setUpcomingTasks;
    }
  };

  // Helper function to get current tasks
  const getCurrentTasks = (section: 'daily' | 'today' | 'upcoming') => {
    switch (section) {
      case 'daily': return dailyTasks;
      case 'today': return todayTasks;
      case 'upcoming': return upcomingTasks;
    }
  };

  // Actions
  const addTasks = (taskDataArray: TaskData[]) => {
    taskDataArray.forEach(taskData => {
      const newTask: Task = {
        id: Date.now().toString() + Math.random(),
        title: taskData.task,
        completed: false,
        createdAt: new Date(),
        priority: taskData.priority,
        startDate: taskData.startDate,
        endDate: taskData.endDate,
        startTime: taskData.startTime,
        endTime: taskData.endTime,
      };

      const setter = getTaskSetter(taskData.section);
      const currentTasks = getCurrentTasks(taskData.section);
      setter([...currentTasks, newTask]);
    });
  };

  const updateTask = (section: 'daily' | 'today' | 'upcoming', taskId: string, updates: Partial<Task>) => {
    const setter = getTaskSetter(section);
    const currentTasks = getCurrentTasks(section);
    setter(currentTasks.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
  };

  const deleteTask = (section: 'daily' | 'today' | 'upcoming', taskId: string) => {
    const setter = getTaskSetter(section);
    const currentTasks = getCurrentTasks(section);
    setter(currentTasks.filter(task => task.id !== taskId));
  };

  const clearCompleted = (section: 'daily' | 'today' | 'upcoming') => {
    const setter = getTaskSetter(section);
    const currentTasks = getCurrentTasks(section);
    setter(currentTasks.filter(task => !task.completed));
  };

  const clearAll = (section: 'daily' | 'today' | 'upcoming') => {
    const setter = getTaskSetter(section);
    setter([]);
  };

  const value: TodoContextType = {
    dailyTasks,
    todayTasks,
    upcomingTasks,
    addTasks,
    updateTask,
    deleteTask,
    clearCompleted,
    clearAll
  };

  return (
    <TodoContext.Provider value={value}>
      {children}
    </TodoContext.Provider>
  );
}