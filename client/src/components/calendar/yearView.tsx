'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '../ui/card';
import { useEffect, useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import { useQuery } from '@tanstack/react-query';
import { todoApi } from '@/lib/api/todos';
import { TaskData } from '@/types/todoTypes';
import { todoKeys } from '@/lib/queryKeys';
import { formatDateString } from '@/lib/utils/dateUtils';

interface YearViewProps {
  selectedDate?: Date;
}

export default function YearView({ selectedDate }: YearViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  const [isMounted, setIsMounted] = useState(false);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  useEffect(() => setIsMounted(true), []);

  // sync from url
  useEffect(() => {
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const day = searchParams.get('day');

    if (year) {
      const monthParam = month ? parseInt(month) - 1 : 0;
      const dayParam = day ? parseInt(day) : 1;
      setCurrentDate(new Date(parseInt(year), monthParam, dayParam));
    } else if (selectedDate) {
      setCurrentDate(selectedDate);
    }
  }, [searchParams, selectedDate]);

  const currentYear = currentDate.getFullYear();
  const { data: allTodos = [] } = useQuery({
    queryKey: todoKeys.calendar(currentYear),
    queryFn: () => todoApi.getCalendarTodos(currentYear),
    enabled: isMounted,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  const todosByDate = useMemo(() => {
    // Don't calculate if data isn't loaded yet
    if (!isMounted || allTodos.length === 0) {
      return {};
    }

    return allTodos.reduce((acc: Record<string, TaskData[]>, todo: TaskData) => {
      if (todo.start_date) {
        // Only include tasks with specific dates (no daily tasks)
        const dateKey = todo.start_date;
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(todo);
      }
      return acc;
    }, {} as Record<string, TaskData[]>);
  }, [allTodos, isMounted]);

  // build a mini calendar for a month
  const getMiniMonthCalendar = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayWeek = firstDay.getDay(); // 0..6 Sun..Sat
    const cells: (Date | null)[] = [];

    for (let i = 0; i < firstDayWeek; i++) cells.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null); // pad to full weeks

    return cells;
  };

  // Get priority circles for a date
  const getPriorityCircles = (date: Date) => {
    const dateKey = formatDateString(date);
    const todos = todosByDate[dateKey] || [];

    // Filter out tasks with section 'none' - these only show in timetable view
    const visibleTodos = todos.filter((t: TaskData) => t.section !== 'none');

    if (visibleTodos.length === 0) return null;

    // Group by priority
    const highPriority = visibleTodos.filter((t: TaskData) => t.priority === 'high');
    const mediumPriority = visibleTodos.filter((t: TaskData) => t.priority === 'medium');
    const lowPriority = visibleTodos.filter((t: TaskData) => t.priority === 'low');
    const noPriority = visibleTodos.filter((t: TaskData) => !t.priority);

    const circles = [];

    // Create target ring effect - outer to inner
    // High priority - outer ring (largest)
    if (highPriority.length > 0) {
      circles.push(
        <div
          key="high"
          className="absolute inset-0 rounded-full border-4 border-red-500"
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'transparent',
            opacity: 0.5
          }}
        />
      );
    }

    // Medium priority - middle ring
    if (mediumPriority.length > 0) {
      circles.push(
        <div
          key="medium"
          className="absolute inset-0 rounded-full border-4 border-yellow-500"
          style={{
            width: '75%',
            height: '75%',
            top: '12.5%',
            left: '12.5%',
            backgroundColor: 'transparent',
            opacity: 0.5
          }}
        />
      );
    }

    // Low priority - inner ring (bigger green border)
    if (lowPriority.length > 0) {
      circles.push(
        <div
          key="low"
          className="absolute inset-0 rounded-full border-4 border-green-500"
          style={{
            width: '55%',
            height: '55%',
            top: '22.5%',
            left: '22.5%',
            backgroundColor: 'transparent',
            opacity: 0.5
          }}
        />
      );
    }

    // No priority - inner ring (smallest)
    if (noPriority.length > 0) {
      circles.push(
        <div
          key="none"
          className="absolute inset-0 rounded-full border-4 border-gray-500"
          style={{
            width: '35%',
            height: '35%',
            top: '32.5%',
            left: '32.5%',
            backgroundColor: 'transparent',
            opacity: 0.5
          }}
        />
      );
    }

    return circles;
  };

  // nav
  const goToPrevYear = () => setCurrentDate(d => new Date(d.getFullYear() - 1, d.getMonth(), d.getDate()));
  const goToNextYear = () => setCurrentDate(d => new Date(d.getFullYear() + 1, d.getMonth(), d.getDate()));
  const goToToday = () => setCurrentDate(new Date());

  const isToday = (date: Date | null) =>
    !!date && date.toDateString() === new Date().toDateString();

  const isSelected = (date: Date | null) =>
    !!date && date.toDateString() === currentDate.toDateString();

  return (
    <div className="w-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-semibold">{isMounted ? currentYear : '--'}</h2>
          <Button variant="outline" size="sm" onClick={goToToday}>Today</Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPrevYear}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={goToNextYear}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Grid 12 months */}
      <Card>
        <div className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {Array.from({ length: 12 }, (_, monthIndex) => {
              const cells = isMounted ? getMiniMonthCalendar(currentYear, monthIndex) : [];
              const weeks: (Date | null)[][] = [];
              for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

              return (
                <div key={monthIndex} className="border rounded-lg p-3 hover:bg-muted/30 transition-colors">
                  {/* Month header → click to month view */}
                  <button
                    className="w-full text-center font-semibold mb-2 text-sm hover:underline"
                    onClick={() => router.push(`/calendar/month?year=${currentYear}&month=${monthIndex + 1}`)}
                  >
                    {monthNames[monthIndex]}
                  </button>

                  {/* Mini calendar */}
                  <div className="space-y-1.5">
                    <div className="grid grid-cols-7 gap-0.5">
                      {dayNames.map((d, i) => (
                        <div key={i} className="text-center text-xs font-medium text-muted-foreground p-0.5">{d}</div>
                      ))}
                    </div>

                    {weeks.map((week, wi) => (
                      <div key={wi} className="grid grid-cols-7 gap-0.5">
                        {week.map((date, di) => {
                          const priorityCircles = date ? getPriorityCircles(date) : null;

                          return (
                            <button
                              key={di}
                              className={`
                                aspect-square flex items-center justify-center text-xs rounded relative
                                ${date ? 'cursor-pointer hover:bg-muted/50 transition-colors' : 'opacity-0 cursor-default'}
                                ${isToday(date) ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : ''}
                              `}
                              onClick={() => {
                                if (!date) return;
                                // click on a day → go to week view
                                router.push(`/calendar/week?year=${date.getFullYear()}&month=${date.getMonth() + 1}&day=${date.getDate()}`);
                              }}
                            >
                              {date ? date.getDate() : ''}
                              {priorityCircles && (
                                <div className="absolute inset-0 pointer-events-none">
                                  {priorityCircles}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}