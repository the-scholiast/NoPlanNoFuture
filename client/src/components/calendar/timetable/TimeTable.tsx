'use client'

import { useSearchParams } from 'next/navigation'
import { Card } from "../../ui/card"
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "../../ui/table"
import { useEffect, useRef, useState } from "react"

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
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    const monday = new Date(d.setDate(diff));

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      weekDates.push(day);
    }
    return weekDates;
  };

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

  /**
   * SCROLL POSITIONING FUNCTIONS
   */

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

  /**
   * INITIALIZATION EFFECT
   */
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

  /**
   * SCROLL LISTENER EFFECT  
   */
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

  // Get week dates using currentDate (which now updates when URL params change)
  let weekDates: Date[] | undefined;
  if (isMounted && currentDate) {
    weekDates = getWeekDates(currentDate);
  } else if (isMounted) {
    weekDates = getWeekDates(new Date());
  }

  return (
    <div className="w-full flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
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
            {timeSlots.map((time) => (
              <TableRow key={time} id={time === "7:00 AM" ? "seven-am-row" : undefined}>
                <TableCell className="font-medium text-sm border-r sticky left-0 bg-background">{time}</TableCell>
                {dayNames.map((dayName, index) => {
                  const isToday = isMounted && weekDates && weekDates[index].toDateString() === new Date().toDateString();
                  return (
                    <TableCell
                      key={`${dayName}-${time}`}
                      className={`h-12 border-r w-32 hover:bg-muted/50 ${isToday ? 'bg-blue-50 dark:bg-blue-950/30' : ''}`}
                    >
                      {/* Event content will go here */}
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