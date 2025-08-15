'use client'

import { useSearchParams } from 'next/navigation'
import { Card } from "../../ui/card"
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "../../ui/table"
import { useEffect, useRef, useState } from "react"
import { useQuery } from '@tanstack/react-query'
import { formatDateString } from '@/lib/utils/dateUtils'
import { timetableApi } from '@/lib/api/timetableApi'

interface TimeTableProps {
  selectedDate?: Date
}

export default function TimeTable({ selectedDate }: TimeTableProps) {
  // Single reference to the Table element
  const tableRef = useRef<HTMLTableElement>(null);
  const searchParams = useSearchParams();
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
  // State to track scroll position and initialization status
  const [savedScrollPosition, setSavedScrollPosition] = useState<number | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Define dayNames at the top to avoid scope issues
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Set mounted state after component mounts to avoid hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Sync with URL parameters - now includes day parameter
  useEffect(() => {
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    const day = searchParams.get('day') // Add day parameter

    if (year && month && day) {
      // Create date with specific day for accurate week calculation
      const urlDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      setCurrentDate(urlDate)
    } else if (year && month) {
      // Fallback to first day of month if day is missing
      const urlDate = new Date(parseInt(year), parseInt(month) - 1, 1)
      setCurrentDate(urlDate)
    } else if (selectedDate) {
      setCurrentDate(selectedDate)
    }
  }, [searchParams, selectedDate]) // This will now trigger when day parameter changes

  /** 
   * Generates a complete day's worth of time slots in 30-minute increments
   * Creates 48 total slots (24 hours × 2 slots per hour)
   * Returns formatted time strings like "7:00 AM", "7:30 AM", etc.
   */
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      // Add the hour slot (e.g., 12:00 AM, 1:00 AM, 12:00 PM, 1:00 PM)
      const hourTime = hour === 0 ? "12:00 AM" :          // Midnight case
        hour < 12 ? `${hour}:00 AM` :                     // Morning hours
          hour === 12 ? "12:00 PM" :                      // Noon case  
            `${hour - 12}:00 PM`;                         // Afternoon/evening hours
      slots.push(hourTime);

      // Add the 30-minute slot (e.g., 12:30 AM, 1:30 AM, 12:30 PM, 1:30 PM)
      if (hour < 24) {
        const halfHourTime = hour === 0 ? "12:30 AM" :    // 30 minutes after midnight
          hour < 12 ? `${hour}:30 AM` :                   // Morning 30-min slots
            hour === 12 ? "12:30 PM" :                    // 30 minutes after noon
              `${hour - 12}:30 PM`;                       // Afternoon/evening 30-min slots
        slots.push(halfHourTime);
      }
    }
    return slots;
  };

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
    enabled: isMounted && !!weekStartDate, // Only fetch when mounted and we have a date
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: 'always', // Always refetch when component mounts
  });

  // Generate header content for each day
  const getDayHeader = (dayName: string, index: number, weekDates?: Date[]) => {
    if (!isMounted || !weekDates) {
      return (
        <div className="flex flex-col items-center">
          <div>{dayName}</div>
          <div className="text-xs font-normal text-muted-foreground">--</div>
        </div>
      );
    }

    const date = weekDates[index];
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    return (
      <div className="flex flex-col items-center">
        <div>{dayName}</div>
        <div className={`text-xs font-normal ${isToday ? 'text-blue-600 font-medium' : 'text-muted-foreground'}`}>
          {date.getDate()}
        </div>
      </div>
    );
  };

  // Generate all time slots
  const timeSlots = generateTimeSlots();

  /**
   * LOCAL STORAGE FUNCTIONS
   */

  const getStoredScrollPosition = (): number | null => {
    try {
      const stored = localStorage.getItem('timetable-scroll-position');
      return stored ? parseInt(stored, 10) : null;
    } catch (e) {
      console.warn('localStorage not available:', e);
      return null;
    }
  };

  const setStoredScrollPosition = (position: number) => {
    try {
      localStorage.setItem('timetable-scroll-position', position.toString());
    } catch (e) {
      console.warn('localStorage not available:', e);
    }
    setSavedScrollPosition(position);
  };

  /**
   * Get the scrollable container (the table wrapper created by shadcn Table component)
   */
  const getScrollContainer = () => {
    const table = tableRef.current;
    if (!table) return null;

    // The shadcn Table component wraps the table in a div with overflow-auto
    // Look for the parent div that has the scroll behavior
    let parent = table.parentElement;
    while (parent) {
      const style = window.getComputedStyle(parent);
      if (style.overflow === 'auto' || style.overflowY === 'auto' ||
        style.overflow === 'scroll' || style.overflowY === 'scroll') {
        return parent;
      }
      parent = parent.parentElement;
      // Stop if we've gone too far up the DOM tree
      if (parent && parent.tagName === 'BODY') break;
    }

    // If no scrollable parent found, return the table's immediate parent
    return table.parentElement;
  };

  // SCROLL POSITIONING FUNCTIONS
  const scrollTo7AM = () => {
    const sevenAmRow = document.getElementById('seven-am-row');
    const scrollContainer = getScrollContainer();

    if (!sevenAmRow || !scrollContainer) return;

    // Find the table header to account for its height
    const tableHeader = tableRef.current?.querySelector('thead');
    const headerHeight = tableHeader?.offsetHeight || 0;

    // Calculate scroll position
    const rowTop = sevenAmRow.offsetTop;
    const scrollPosition = rowTop - headerHeight;

    // Set scroll position
    scrollContainer.scrollTop = scrollPosition;
    scrollContainer.scrollTo({
      top: scrollPosition,
      behavior: 'smooth'
    });

    setStoredScrollPosition(scrollPosition);
  };

  const restoreScrollPosition = (position: number) => {
    const scrollContainer = getScrollContainer();
    if (!scrollContainer) return;

    scrollContainer.scrollTop = position;
    scrollContainer.scrollTo({
      top: position,
      behavior: 'auto'
    });

    setSavedScrollPosition(position);
  };

  const saveCurrentScrollPosition = () => {
    const scrollContainer = getScrollContainer();
    if (!scrollContainer) return;

    const currentPosition = scrollContainer.scrollTop;
    console.log(`Saving scroll position: ${currentPosition}px`);
    setStoredScrollPosition(currentPosition);
  };

  // INITIALIZATION EFFECT
  useEffect(() => {
    const initializePosition = () => {
      if (hasInitialized) return;

      const storedPosition = getStoredScrollPosition();

      if (storedPosition !== null && storedPosition > 0) {
        console.log('Restoring saved position:', storedPosition);
        restoreScrollPosition(storedPosition);
      } else {
        console.log('No saved position, scrolling to 7 AM');
        scrollTo7AM();
      }
      setHasInitialized(true);
    };

    // Delay initialization to ensure DOM is fully rendered
    const timer = setTimeout(initializePosition, 500);
    return () => clearTimeout(timer);
  }, [hasInitialized]);

  // SCROLL LISTENER EFFECT  
  useEffect(() => {
    const scrollContainer = getScrollContainer();
    if (!scrollContainer) return;

    const handleScroll = () => {
      saveCurrentScrollPosition();
    };

    // Use passive listener for better performance
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    // Cleanup function
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [hasInitialized]);

  // Helper to get tasks for a specific time slot
  const getTasksForTimeSlot = (dayIndex: number, timeSlot: string, weekDates: Date[]) => {
    if (!weekDates || !scheduledTasks) return [];

    const dayDate = formatDateString(weekDates[dayIndex]);

    // Convert time slot to 24-hour format for comparison
    const convertTo24Hour = (timeStr: string): string => {
      const [time, period] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);

      if (period === 'AM' && hours === 12) hours = 0;
      if (period === 'PM' && hours !== 12) hours += 12;

      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    const slotTime = convertTo24Hour(timeSlot);

    return scheduledTasks.filter(task => {
      const taskDate = task.instance_date || task.start_date;
      if (taskDate !== dayDate) return false;

      if (!task.start_time || !task.end_time) return false;

      const taskStart = task.start_time;
      const taskEnd = task.end_time;

      // Convert slot time to minutes for easier comparison
      const [slotHours, slotMinutes] = slotTime.split(':').map(Number);
      const slotStartMinutes = slotHours * 60 + slotMinutes;
      const slotEndMinutes = slotStartMinutes + 30;

      // Convert task times to minutes
      const [taskStartHours, taskStartMins] = taskStart.split(':').map(Number);
      const [taskEndHours, taskEndMins] = taskEnd.split(':').map(Number);
      const taskStartMinutes = taskStartHours * 60 + taskStartMins;
      const taskEndMinutes = taskEndHours * 60 + taskEndMins;

      // Task should appear in this slot if it starts within this 30-minute window
      // OR if it was already running when this slot started
      return taskStartMinutes < slotEndMinutes && taskEndMinutes > slotStartMinutes;
    });
  };

  return (
    <div className="w-full flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
      {tasksError && (
        <div className="text-red-500 text-sm mb-2 px-4 py-2 bg-red-50 rounded">
          Error loading tasks: {tasksError.message}
        </div>
      )}
      <Card className="flex-1 overflow-auto relative">
        <Table ref={tableRef}>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead className="w-24 border-r bg-background">Time</TableHead>
              {dayNames.map((dayName, index) => {
                const headerContent = getDayHeader(dayName, index, weekDates);
                const isToday = isMounted && weekDates && weekDates[index].toDateString() === new Date().toDateString();

                return (
                  <TableHead
                    key={dayName}
                    className={`text-center w-32 bg-background ${isToday ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''}`}
                  >
                    {headerContent}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {generateTimeSlots().map((time) => (
              <TableRow key={time} id={time === "7:00 AM" ? "seven-am-row" : undefined}>
                <TableCell className="font-medium text-sm border-r sticky left-0 bg-background">
                  {time}
                </TableCell>
                {dayNames.map((dayName, index) => {
                  const isToday = isMounted && weekDates && weekDates[index].toDateString() === new Date().toDateString();
                  const tasks = weekDates.length > 0 ? getTasksForTimeSlot(index, time, weekDates) : [];

                  return (
                    <TableCell
                      key={`${dayName}-${time}`}
                      className={`h-12 border-r w-32 hover:bg-muted/50 ${isToday ? 'bg-blue-50 dark:bg-blue-950/30' : ''} relative p-1`}
                    >
                      {tasks.map((task) => (
                        <div
                          key={task.id}
                          className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded px-1 py-0.5 mb-0.5 truncate"
                          title={`${task.title}\n${task.start_time} - ${task.end_time}`}
                        >
                          {task.title}
                        </div>
                      ))}
                      {isLoadingTasks && index === 0 && time === "7:00 AM" && (
                        <div className="text-xs text-muted-foreground">Loading...</div>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}