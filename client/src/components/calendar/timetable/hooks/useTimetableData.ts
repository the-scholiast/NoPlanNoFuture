import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { formatDateString } from '@/lib/utils/dateUtils';
import { timetableApi } from '@/lib/api/timetableApi';
import { useTodo } from '@/contexts/TodoContext';

interface UseTimetableDataProps {
  selectedDate?: Date;
}

export const useTimetableData = ({ selectedDate }: UseTimetableDataProps) => {
  const searchParams = useSearchParams();
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  const [isMounted, setIsMounted] = useState(false);
  const { refetchTimetable } = useTodo();

  // Set mounted state after component mounts to avoid hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sync with URL parameters - now includes day parameter
  useEffect(() => {
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const day = searchParams.get('day');

    if (year && month && day) {
      const urlDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      setCurrentDate(urlDate);
    } else if (year && month) {
      const urlDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      setCurrentDate(urlDate);
    } else if (selectedDate) {
      setCurrentDate(selectedDate);
    }
  }, [searchParams, selectedDate]);

  // Get the current week's dates based on selectedDate
  const getWeekDates = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      weekDates.push(day);
    }
    return weekDates;
  };

  // Calculate current week start date
  const weekDates = isMounted && currentDate ? getWeekDates(currentDate) : [];
  const weekStartDate = weekDates.length > 0 ? formatDateString(weekDates[0]) : '';

  // Use useQuery directly for automatic caching and reactivity
  const {
    data: scheduledTasks = [],
    isLoading: isLoadingTasks,
    error: tasksError,
    refetch: refetchTasks
  } = useQuery({
    queryKey: ['timetable-week', weekStartDate],
    queryFn: () => timetableApi.getWeekScheduledTasks(weekStartDate),
    enabled: isMounted && !!weekStartDate,
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    refetchInterval: false,
  });

  const handleDataRefresh = () => {
    refetchTimetable(weekStartDate);
    refetchTasks();
  };

  return {
    currentDate,
    isMounted,
    weekDates,
    weekStartDate,
    scheduledTasks,
    isLoadingTasks,
    tasksError,
    refetchTasks,
    handleDataRefresh
  };
}