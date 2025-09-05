'use client';

import { useMemo, useCallback } from 'react';
import {
    generateTimeSlots,
    getTasksForTimeSlot,
    getTaskDurationSlots,
    isFirstSlotForTask,
} from '../utils';
import { TaskData } from '@/types/todoTypes';

type TimetableTask = TaskData & {
    start_time: string;
    end_time: string;
};

const SLOTS_TO_HOURS = 0.5;

function hasTimeFields(t: TaskData): t is TimetableTask {
    return typeof t.start_time === 'string' && typeof t.end_time === 'string';
}

function sameDay(a: Date, b: Date): boolean {
    return a.toDateString() === b.toDateString();
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

    // Unique tasks per day column so a multi-slot task is counted once
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

    const sumHours = (tasks: TimetableTask[]) =>
        tasks.reduce((acc, t) => acc + getTaskDurationSlots(t) * SLOTS_TO_HOURS, 0);

    // Per-day (this week)
    const perDayThisWeek = useMemo(
        () => weekDates.map((_, i) => sumHours(getUniqueTasksForDay(i))),
        [weekDates, getUniqueTasksForDay]
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

    // Month total:
    // If caller passes monthTasks, compute from them; otherwise fall back to week.
    const monthHours = useMemo(() => {
        if (opts?.monthTasks && opts.monthTasks.length > 0) {
            const monthSafe = opts.monthTasks.filter(hasTimeFields);
            const unique = new Map<string, TimetableTask>();
            for (const t of monthSafe) if (!unique.has(t.id)) unique.set(t.id, t);
            return sumHours([...unique.values()]);
        }
        return weekHours;
    }, [opts?.monthTasks, weekHours]);

    return { todayHours, weekHours, monthHours, perDayThisWeek };
}
