'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTimetableData } from '@/components/calendar/timetable/hooks/useTimetableData';
import { formatDateString } from '@/lib/utils/dateUtils';
import type { Task } from '../types';
import { convertTimetableTaskToRadial } from '../utils';

export const useRadialPlanner = () => {
  const [plannerTasks, setPlannerTasks] = useState<Task[]>([]);
  const { currentDate, scheduledTasks, isMounted } = useTimetableData({});
  
  const selectedDateString = useMemo(() => 
    currentDate ? formatDateString(currentDate) : '', 
    [currentDate]
  );

  const localKey = useMemo(() => 
    selectedDateString ? `radial-planner-${selectedDateString}` : '', 
    [selectedDateString]
  );

  // Convert timetable tasks to radial format
  const timetableDayTasks: Task[] = useMemo(() => {
    if (!isMounted || !selectedDateString) return [];
    
    const dayTasks = (scheduledTasks || []).filter((t) => {
      const dateStr = (t.instance_date || t.start_date) || '';
      return dateStr === selectedDateString;
    });
    
    return dayTasks
      .map(convertTimetableTaskToRadial)
      .filter((t): t is Task => t !== null);
  }, [isMounted, selectedDateString, scheduledTasks]);

  // Load planner tasks from localStorage
  useEffect(() => {
    if (!localKey) return;
    
    try {
      const raw = localStorage.getItem(localKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Task>[];
        const normalized: Task[] = parsed.map((p): Task => ({
          title: p.title || '',
          start: typeof p.start === 'number' ? p.start : 0,
          end: typeof p.end === 'number' ? p.end : 0,
          remarks: p.remarks || '',
          hourGroup: (p.hourGroup as 'AM' | 'PM') || 'AM',
          displayRing: p.displayRing,
          id: p.id,
          source: 'planner',
          isRecurring: false,
        }));
        setPlannerTasks(normalized);
      } else {
        setPlannerTasks([]);
      }
    } catch (e) {
      console.warn('Failed to load planner tasks from localStorage', e);
      setPlannerTasks([]);
    }
  }, [localKey]);

  // Persist planner tasks to localStorage
  const persistPlannerTasks = (items: Task[]) => {
    if (!localKey) return;
    setPlannerTasks(items);
    try {
      localStorage.setItem(localKey, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save planner tasks to localStorage', e);
    }
  };

  // Add new planner task
  const addPlannerTask = (task: Task) => {
    const next = [...plannerTasks, task];
    persistPlannerTasks(next);
  };

  // Delete planner task
  const deletePlannerTask = (id?: string) => {
    if (!id) return;
    const next = plannerTasks.filter(t => t.id !== id);
    persistPlannerTasks(next);
  };

  // Combine all tasks
  const allTasks = useMemo(() => 
    [...timetableDayTasks, ...plannerTasks], 
    [timetableDayTasks, plannerTasks]
  );

  return {
    plannerTasks,
    timetableDayTasks,
    allTasks,
    addPlannerTask,
    deletePlannerTask,
    selectedDateString,
    isMounted
  };
};
