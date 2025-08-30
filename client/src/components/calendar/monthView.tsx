'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '../ui/card';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TaskData } from '@/types/todoTypes';
import { todoKeys } from '@/lib/queryKeys';
import { recurringTodoApi } from '@/lib/api';
import { formatDateString, getTodayString } from '@/lib/utils/dateUtils';

const PRIORITY_ORDER = { 'high': 0, 'medium': 1, 'low': 2, undefined: 3 };

interface MonthViewProps {
  selectedDate?: Date;
  weekStartsOn?: 'mon' | 'sun'; // optional: choose Monday-first or Sunday-first (default: Monday)
}

export default function MonthView({ selectedDate, weekStartsOn = 'mon' }: MonthViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentDate, setCurrentDate] = useState<Date>(selectedDate || new Date());
  const [isMounted, setIsMounted] = useState(false);

  // Labels
  const dayNamesMonFirst = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dayNamesSunFirst = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayNames = weekStartsOn === 'mon' ? dayNamesMonFirst : dayNamesSunFirst;

  useEffect(() => setIsMounted(true), []);

  const { data: monthTasks = [] } = useQuery({
    queryKey: todoKeys.monthTasks(currentDate.getFullYear(), currentDate.getMonth() + 1),
    queryFn: () => recurringTodoApi.getMonthTasks(currentDate.getFullYear(), currentDate.getMonth() + 1),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes Cache garbage collection
  });

  // Group todos by date for quick lookup
  const todosByDate = useMemo(() => {

    return monthTasks.reduce((acc: Record<string, TaskData[]>, todo: TaskData) => {
      // For recurring instances, use instance_date; for regular tasks, use start_date
      let dateKey: string | null = null;

      if (todo.instance_date) {
        // This is a recurring instance
        dateKey = todo.instance_date;
      } else if (todo.start_date) {
        // This is a regular task
        dateKey = todo.start_date;
      }

      if (dateKey) {
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(todo);
      }
      return acc;
    }, {} as Record<string, TaskData[]>);
  }, [monthTasks]);

  // Get tasks for a specific date with proper sorting
  const getTasksForDate = (date: Date) => {
    const dateKey = formatDateString(date);
    const todos = todosByDate[dateKey] || [];
    const today = getTodayString();

    // Filter out tasks with section 'none' - these only show in timetable view
    const filteredTodos = todos.filter((t: TaskData) => t.section !== 'none');

    // Sort tasks by priority order: due today by priority, then upcoming, then daily
    return filteredTodos.sort((a, b) => {
      const aIsToday = (a.instance_date || a.start_date) === today;
      const bIsToday = (b.instance_date || b.start_date) === today;
      const aIsDaily = a.section === 'daily';
      const bIsDaily = b.section === 'daily';

      // 1. Tasks due today come first
      if (aIsToday && !bIsToday) return -1;
      if (!aIsToday && bIsToday) return 1;

      // 2. Among tasks due today, sort by priority
      if (aIsToday && bIsToday) {
        const aPriority = PRIORITY_ORDER[a.priority as keyof typeof PRIORITY_ORDER] ?? 3;
        const bPriority = PRIORITY_ORDER[b.priority as keyof typeof PRIORITY_ORDER] ?? 3;
        if (aPriority !== bPriority) return aPriority - bPriority;
      }

      // 3. Daily tasks come last
      if (aIsDaily && !bIsDaily) return 1;
      if (!aIsDaily && bIsDaily) return -1;

      // 4. For remaining tasks (upcoming), sort by priority
      const aPriority = PRIORITY_ORDER[a.priority as keyof typeof PRIORITY_ORDER] ?? 3;
      const bPriority = PRIORITY_ORDER[b.priority as keyof typeof PRIORITY_ORDER] ?? 3;
      return aPriority - bPriority;
    });
  };

  // Get priority dot color
  const getPriorityDotColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  // Sync from URL: /calendar/month?year=YYYY&month=MM[&day=DD]
  useEffect(() => {
    const y = searchParams.get('year');
    const m = searchParams.get('month');
    const d = searchParams.get('day');
    if (y && m) {
      const day = d ? parseInt(d) : 1;
      setCurrentDate(new Date(parseInt(y), parseInt(m) - 1, day));
    } else if (selectedDate) {
      setCurrentDate(selectedDate);
    }
  }, [searchParams, selectedDate]);

  /**
   * Build a month grid that:
   * - Shows only the weeks needed to cover the current month.
   * - Adds "overlay" days from previous/next month only to fill the first/last week.
   * - Does NOT append an extra whole week from the next month.
   *
   * Returns an array of Date objects (length = 7 * number_of_weeks).
   * You can detect overlay cells by checking date.getMonth() !== currentMonth.
   */
  const getMonthCellsWithOverlay = (base: Date) => {
    const year = base.getFullYear();
    const month = base.getMonth();

    // First/last day of current month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Day-of-week index for the first day, adjusted by weekStartsOn
    // JS: 0=Sun..6=Sat
    const firstDowJS = firstDay.getDay();
    const firstDow = weekStartsOn === 'mon'
      ? (firstDowJS + 6) % 7 // Mon-first (Mon=0..Sun=6)
      : firstDowJS;          // Sun-first (Sun=0..Sat=6)

    // Total cells needed = leading blanks + month days
    const totalCells = firstDow + daysInMonth;
    const weeks = Math.ceil(totalCells / 7);     // minimal weeks to cover the month
    const neededCells = weeks * 7;               // exact number of cells to render

    const cells: Date[] = [];

    // 1) Leading overlay from previous month (only what's needed)
    if (firstDow > 0) {
      // Start from firstDay minus `firstDow` days
      const startPrev = new Date(firstDay);
      startPrev.setDate(firstDay.getDate() - firstDow);
      for (let i = 0; i < firstDow; i++) {
        const d = new Date(startPrev);
        d.setDate(startPrev.getDate() + i);
        cells.push(d);
      }
    }

    // 2) Actual current month days
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(new Date(year, month, day));
    }

    // 3) Trailing overlay from next month (only to fill the last week)
    while (cells.length < neededCells) {
      const last = cells[cells.length - 1];
      const next = new Date(last);
      next.setDate(last.getDate() + 1);
      cells.push(next);
    }

    return cells;
  };

  const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const isSameMonth = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

  // Build cells only when mounted (to avoid hydration mismatch)
  const cells = useMemo(
    () => (isMounted ? getMonthCellsWithOverlay(currentDate) : []),
    [currentDate, isMounted, getMonthCellsWithOverlay]
  );

  // Split into weeks
  const weeks: Date[][] = useMemo(() => {
    const out: Date[][] = [];
    for (let i = 0; i < cells.length; i += 7) out.push(cells.slice(i, i + 7));
    return out;
  }, [cells]);

  return (
    <div className="w-full flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
      {/* Month grid (only the needed weeks; overlays included only to complete edges) */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="p-2 flex flex-col h-full">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((n) => (
              <div key={n} className="p-2 text-center text-sm font-medium text-muted-foreground border-b">
                {n}
              </div>
            ))}
          </div>

          {/* Weeks */}
          <div className="grid gap-1 flex-1" style={{ gridTemplateRows: `repeat(${weeks.length}, 1fr)` }}>
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1">
                {week.map((date) => {
                  const overlay = !isSameMonth(date, currentDate); // overlay detection
                  const isToday = isSameDay(date, new Date());

                  return (
                    <button
                      key={date.toISOString()}
                      className={`
                        h-full p-2 border rounded-lg text-left transition-colors flex flex-col relative
                        ${overlay ? 'bg-muted/20 text-muted-foreground' : 'bg-background'}
                        ${isToday ? 'ring-2 ring-blue-500' : ''}
                        ${overlay ? 'hover:bg-muted/30' : 'hover:bg-muted/50'}
                      `}
                      onClick={() => {
                        router.push(
                          `/calendar/week?year=${date.getFullYear()}&month=${date.getMonth() + 1}&day=${date.getDate()}`
                        );
                      }}
                    >
                      <div className="text-sm font-medium mb-1 flex-shrink-0 text-center">
                        {date.getDate()}
                      </div>
                      <div className="flex-1 space-y-1">
                        {/* Always visible tasks (first 3) */}
                        {getTasksForDate(date).slice(0, 3).map((task) => (
                          <div key={task.id} className="flex items-center gap-1 text-xs">
                            <div
                              className={`w-2 h-2 rounded-full opacity-50 ${getPriorityDotColor(task.priority)}`}
                            />
                            <span className="truncate">{task.title}</span>
                          </div>
                        ))}
                        {getTasksForDate(date).length > 3 && (
                          <div className="text-xs text-muted-foreground text-center">
                            +{getTasksForDate(date).length - 3} more
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}