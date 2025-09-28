'use client';

import { useMemo, useCallback } from 'react';
import {
    generateTimeSlots,
    getTasksForTimeSlot,
    isFirstSlotForTask,
} from '../utils';
import { TaskData } from '@/types/todoTypes';

type TimetableTask = TaskData & {
    start_time: string;
    end_time: string;
};

function hasTimeFields(t: TaskData): t is TimetableTask {
    return typeof t.start_time === 'string' && typeof t.end_time === 'string';
}

function sameDay(a: Date, b: Date): boolean {
    return a.toDateString() === b.toDateString();
}

// Calculate actual work hours
function calculateActualHours(task: TimetableTask): number {
    const startTime = task.start_time;
    const endTime = task.end_time;
    
    // Convert time to minutes
    const [startHours, startMins] = startTime.split(':').map(Number);
    const [endHours, endMins] = endTime.split(':').map(Number);
    
    const startMinutes = startHours * 60 + startMins;
    const endMinutes = endHours * 60 + endMins;
    
    const durationMinutes = endMinutes - startMinutes;
    return durationMinutes / 60; // Convert to hours
}

// Check if two tasks overlap
function tasksOverlap(task1: TimetableTask, task2: TimetableTask): boolean {
    const [start1Hours, start1Mins] = task1.start_time.split(':').map(Number);
    const [end1Hours, end1Mins] = task1.end_time.split(':').map(Number);
    const [start2Hours, start2Mins] = task2.start_time.split(':').map(Number);
    const [end2Hours, end2Mins] = task2.end_time.split(':').map(Number);
    
    const start1Minutes = start1Hours * 60 + start1Mins;
    const end1Minutes = end1Hours * 60 + end1Mins;
    const start2Minutes = start2Hours * 60 + start2Mins;
    const end2Minutes = end2Hours * 60 + end2Mins;
    
    return start1Minutes < end2Minutes && start2Minutes < end1Minutes;
}

// Calculate total non-overlapping work hours
function calculateNonOverlappingHours(tasks: TimetableTask[]): number {
    if (tasks.length === 0) return 0;
    if (tasks.length === 1) return calculateActualHours(tasks[0]);
    
    // Sort by start time
    const sortedTasks = [...tasks].sort((a, b) => {
        const [aHours, aMins] = a.start_time.split(':').map(Number);
        const [bHours, bMins] = b.start_time.split(':').map(Number);
        return (aHours * 60 + aMins) - (bHours * 60 + bMins);
    });
    
    let totalHours = 0;
    let currentEnd = 0;
    
    for (const task of sortedTasks) {
        const [startHours, startMins] = task.start_time.split(':').map(Number);
        const [endHours, endMins] = task.end_time.split(':').map(Number);
        const startMinutes = startHours * 60 + startMins;
        const endMinutes = endHours * 60 + endMins;
        
        if (startMinutes >= currentEnd) {
            // No overlap, add entire task time
            totalHours += calculateActualHours(task);
            currentEnd = endMinutes;
        } else if (endMinutes > currentEnd) {
            // Has overlap, only add non-overlapping part
            const overlapMinutes = currentEnd - startMinutes;
            const taskMinutes = endMinutes - startMinutes;
            const nonOverlapMinutes = taskMinutes - overlapMinutes;
            totalHours += nonOverlapMinutes / 60;
            currentEnd = endMinutes;
        }
        // If completely covered, don't count
    }
    
    return totalHours;
}

export function useWorkHourTotals(
    weekDatesRO: ReadonlyArray<Date>,
    scheduledTasksRO: ReadonlyArray<TaskData>,
    opts?: { monthTasks?: ReadonlyArray<TaskData>; monthRefDate?: Date }
) {
    const timeSlots = useMemo(() => generateTimeSlots(), []);

    // Clone to mutable arrays in case your utils require mutable params
    const weekDates = useMemo(() => [...weekDatesRO], [weekDatesRO]);
    const scheduledTasks = useMemo(() => [...scheduledTasksRO], [scheduledTasksRO]);

    // Filter to tasks that have start/end times
    const safeTasks = useMemo(
        () => scheduledTasks.filter(hasTimeFields),
        [scheduledTasks]
    );

    // Get all unique tasks for a specific day
    const getUniqueTasksForDay = useCallback(
        (dayIndex: number) => {
            const byId = new Map<string, TimetableTask>();
            for (const time of timeSlots) {
                const tasksAtTime = getTasksForTimeSlot(dayIndex, time, weekDates, safeTasks) as TimetableTask[];
                for (const t of tasksAtTime) {
                    if (isFirstSlotForTask(t, time) && !byId.has(t.id)) {
                        byId.set(t.id, t);
                    }
                }
            }
            return [...byId.values()];
        },
        [timeSlots, weekDates, safeTasks]
    );

    // Calculate work sessions count for a specific day (based on time slots)
    const getWorkSessionsForDay = useCallback(
        (dayIndex: number) => {
            const dayTasks = getUniqueTasksForDay(dayIndex);
            if (dayTasks.length === 0) return 0;
            
            // Sort tasks by start time
            const sortedTasks = [...dayTasks].sort((a, b) => {
                const [aHours, aMins] = a.start_time.split(':').map(Number);
                const [bHours, bMins] = b.start_time.split(':').map(Number);
                return (aHours * 60 + aMins) - (bHours * 60 + bMins);
            });
            
            let sessionCount = 0;
            let currentEnd = 0;
            
            for (const task of sortedTasks) {
                const [startHours, startMins] = task.start_time.split(':').map(Number);
                const [endHours, endMins] = task.end_time.split(':').map(Number);
                const startMinutes = startHours * 60 + startMins;
                const endMinutes = endHours * 60 + endMins;
                
                if (startMinutes >= currentEnd) {
                    // New session (no overlap with previous)
                    sessionCount++;
                    currentEnd = endMinutes;
                } else if (endMinutes > currentEnd) {
                    // Extends current session
                    currentEnd = endMinutes;
                }
                // If completely covered by previous session, don't count as new session
            }
            
            return sessionCount;
        },
        [getUniqueTasksForDay]
    );

    // Calculate non-overlapping work hours for a specific day
    const getNonOverlappingHoursForDay = useCallback(
        (dayIndex: number) => {
            const dayTasks = getUniqueTasksForDay(dayIndex);
            return calculateNonOverlappingHours(dayTasks);
        },
        [getUniqueTasksForDay]
    );

    // Daily work hours for this week (non-overlapping)
    const perDayThisWeek = useMemo(
        () => weekDates.map((_, i) => getNonOverlappingHoursForDay(i)),
        [weekDates, getNonOverlappingHoursForDay]
    );

    // Daily work sessions count for this week
    const perDayWorkSessions = useMemo(
        () => weekDates.map((_, i) => getWorkSessionsForDay(i)),
        [weekDates, getWorkSessionsForDay]
    );

    // Today
    const today = new Date();
    const todayIndex = weekDates.findIndex((d) => sameDay(d, today));
    const todayHours = todayIndex >= 0 ? perDayThisWeek[todayIndex] : 0;

    // Week total
    const weekHours = useMemo(
        () => perDayThisWeek.reduce((a, b) => a + b, 0),
        [perDayThisWeek]
    );

    // Month total: use actual month data
    const monthHours = useMemo(() => {
        if (opts?.monthTasks && opts.monthTasks.length > 0) {
            const monthSafe = opts.monthTasks.filter(hasTimeFields);
            // Group by date
            const tasksByDate = new Map<string, TimetableTask[]>();
            
            for (const task of monthSafe) {
                const taskDate = task.instance_date || task.start_date;
                if (taskDate) {
                    if (!tasksByDate.has(taskDate)) {
                        tasksByDate.set(taskDate, []);
                    }
                    tasksByDate.get(taskDate)!.push(task);
                }
            }
            
            // Calculate non-overlapping hours for each day and sum up
            let totalMonthHours = 0;
            for (const [, dayTasks] of tasksByDate) {
                totalMonthHours += calculateNonOverlappingHours(dayTasks);
            }
            
            return totalMonthHours;
        }
        return weekHours;
    }, [opts?.monthTasks, weekHours]);

    return { 
        todayHours, 
        weekHours, 
        monthHours, 
        perDayThisWeek,
        perDayWorkSessions // New: daily work sessions array
    };
}
