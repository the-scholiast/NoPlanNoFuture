'use client'

import { useSearchParams } from 'next/navigation'
import { Card } from "../../ui/card"
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "../../ui/table"
import { useEffect, useRef, useState } from "react"
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { formatDateString } from '@/lib/utils/dateUtils'
import { timetableApi } from '@/lib/api/timetableApi'
import EditTaskModal from '@/components/todo/EditTaskModal'
import AddTaskModal from '@/components/todo/global/AddTaskModal'
import { TaskData } from '@/types/todoTypes'
import { useTodo } from '@/contexts/TodoContext'
import { getTaskColors } from '@/components/todo/shared/utils/sectionUtils'


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
  // Add this state after the existing hooks
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);

  // Add modal state management
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskData | null>(null);

  const [preFilledData, setPreFilledData] = useState<{
    selectedDate?: string;
    selectedTime?: string;
  } | undefined>(undefined);

  // Add after line 100 (after other helper functions)
  const detectTimeConflicts = (dayIndex: number, weekDates: Date[]) => {
    if (!weekDates || !scheduledTasks) return new Set<string>();

    const conflicts = new Set<string>();
    const dayDate = formatDateString(weekDates[dayIndex]);
    const dayTasks = scheduledTasks.filter(task => {
      const taskDate = task.instance_date || task.start_date;
      return taskDate === dayDate && task.start_time && task.end_time;
    });

    // Check each task against all others
    for (let i = 0; i < dayTasks.length; i++) {
      for (let j = i + 1; j < dayTasks.length; j++) {
        const task1 = dayTasks[i];
        const task2 = dayTasks[j];

        if (tasksOverlap(task1, task2)) {
          conflicts.add(task1.id);
          conflicts.add(task2.id);
        }
      }
    }

    return conflicts;
  };

  const tasksOverlap = (task1: any, task2: any): boolean => {
    const getMinutes = (timeStr: string): number => {
      const [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const task1Start = getMinutes(task1.start_time);
    const task1End = getMinutes(task1.end_time);
    const task2Start = getMinutes(task2.start_time);
    const task2End = getMinutes(task2.end_time);

    return task1Start < task2End && task2Start < task1End;
  };
  // Get timetable invalidation functions from TodoContext
  const { invalidateTimetableCache, refetchTimetable } = useTodo();

  // Add helper function to check if ANY cell in this row contains the hovered task
  const shouldHighlightRow = (time: string, weekDates: Date[]) => {
    if (!hoveredTaskId || !weekDates || !scheduledTasks) return false;

    // Check if any day in this time slot contains the hovered task
    for (let dayIndex = 0; dayIndex < dayNames.length; dayIndex++) {
      const tasks = getTasksForTimeSlot(dayIndex, time, weekDates);
      if (tasks.some(task => task.id === hoveredTaskId)) {
        return true;
      }
    }
    return false;
  };

  // Add helper function to check if this row has any conflicts
  const hasRowConflicts = (time: string, weekDates: Date[]) => {
    if (!weekDates || !scheduledTasks) return false;

    // Check if any day in this time slot has conflicting tasks
    for (let dayIndex = 0; dayIndex < dayNames.length; dayIndex++) {
      const tasks = getTasksForTimeSlot(dayIndex, time, weekDates);
      if (tasks.length > 1) {
        const conflicts = detectTimeConflicts(dayIndex, weekDates);
        if (tasks.some(task => conflicts.has(task.id))) {
          return true;
        }
      }
    }
    return false;
  };

  // Helper to calculate task duration in time slots
  const getTaskDurationSlots = (task: any, timeSlots: string[]) => {
    if (!task.start_time || !task.end_time) return 1;

    const convertTo24Hour = (timeStr: string): string => {
      const [time, period] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (period === 'AM' && hours === 12) hours = 0;
      if (period === 'PM' && hours !== 12) hours += 12;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    const startTime24 = convertTo24Hour(task.start_time);
    const endTime24 = convertTo24Hour(task.end_time);

    const [startHours, startMins] = startTime24.split(':').map(Number);
    const [endHours, endMins] = endTime24.split(':').map(Number);

    const startMinutes = startHours * 60 + startMins;
    const endMinutes = endHours * 60 + endMins;

    const durationMinutes = endMinutes - startMinutes;
    return Math.ceil(durationMinutes / 30); // Each slot is 30 minutes
  };

  // Helper to check if this is the first slot for a task
  const isFirstSlotForTask = (task: any, currentTime: string, dayIndex: number, weekDates: Date[]) => {
    if (!task.start_time) return true;

    const convertTo24Hour = (timeStr: string): string => {
      const [time, period] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);
      if (period === 'AM' && hours === 12) hours = 0;
      if (period === 'PM' && hours !== 12) hours += 12;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    const currentTime24 = convertTo24Hour(currentTime);
    const taskStartTime24 = convertTo24Hour(task.start_time);

    const [currentHours, currentMins] = currentTime24.split(':').map(Number);
    const [taskStartHours, taskStartMins] = taskStartTime24.split(':').map(Number);

    const currentMinutes = currentHours * 60 + currentMins;
    const taskStartMinutes = taskStartHours * 60 + taskStartMins;

    // This is the first slot if the current time slot contains the task start time
    return currentMinutes <= taskStartMinutes && taskStartMinutes < currentMinutes + 30;
  };

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
    staleTime: 0, // Always consider stale for immediate updates
    gcTime: 1000 * 60 * 5, // 5 minutes garbage collection
    refetchOnWindowFocus: true,
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchInterval: false, // Don't auto-refetch, we'll handle it manually
  });

  // Enhanced modal close handlers to ensure data refresh
  useEffect(() => {
    if (!editModalOpen && !addModalOpen) {
      // When both modals are closed, ensure we have the latest data
      const timer = setTimeout(() => {
        refetchTasks();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [editModalOpen, addModalOpen, refetchTasks]);

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

  // Helper to calculate which tasks should be displayed in each slot with merging
  const getMergedTasksForDay = (dayIndex: number, weekDates: Date[]) => {
    if (!weekDates || !scheduledTasks) return {};

    const dayDate = formatDateString(weekDates[dayIndex]);
    const dayTasks = scheduledTasks.filter(task => {
      const taskDate = task.instance_date || task.start_date;
      return taskDate === dayDate && task.start_time && task.end_time;
    });

    const slotTasks: { [timeSlot: string]: any[] } = {};

    // Convert time slot to 24-hour format for comparison
    const convertTo24Hour = (timeStr: string): string => {
      const [time, period] = timeStr.split(' ');
      let [hours, minutes] = time.split(':').map(Number);

      if (period === 'AM' && hours === 12) hours = 0;
      if (period === 'PM' && hours !== 12) hours += 12;

      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    // Process each task to determine which slots it spans
    dayTasks.forEach(task => {
      if (!task.start_time || !task.end_time) {
        return; // Skip this task if times are missing
      }
      const taskStart = task.start_time;
      const taskEnd = task.end_time;

      // Convert task times to minutes
      const [taskStartHours, taskStartMins] = taskStart.split(':').map(Number);
      const [taskEndHours, taskEndMins] = taskEnd.split(':').map(Number);
      const taskStartMinutes = taskStartHours * 60 + taskStartMins;
      const taskEndMinutes = taskEndHours * 60 + taskEndMins;

      // Find all time slots this task spans
      const taskSlots = timeSlots.filter(timeSlot => {
        const slotTime = convertTo24Hour(timeSlot);
        const [slotHours, slotMinutes] = slotTime.split(':').map(Number);
        const slotStartMinutes = slotHours * 60 + slotMinutes;
        const slotEndMinutes = slotStartMinutes + 30;

        return taskStartMinutes < slotEndMinutes && taskEndMinutes > slotStartMinutes;
      });

      // For multi-slot tasks, only show in the first slot
      if (taskSlots.length > 0) {
        const firstSlot = taskSlots[0];
        if (!slotTasks[firstSlot]) {
          slotTasks[firstSlot] = [];
        }

        // Calculate the height multiplier based on how many slots the task spans
        const spanCount = taskSlots.length;
        slotTasks[firstSlot].push({
          ...task,
          spanCount,
          isSpanning: spanCount > 1
        });
      }
    });

    return slotTasks;
  };

  // Helper function to format date for task creation
  const formatDateForTask = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper function to convert time slot to 24-hour format
  const convertTimeSlotTo24Hour = (timeSlot: string): string => {
    const [time, period] = timeSlot.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (period === 'AM' && hours === 12) hours = 0;
    if (period === 'PM' && hours !== 12) hours += 12;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Handle clicking on a task
  const handleTaskClick = (task: any) => {
    setTaskToEdit(task);
    setEditModalOpen(true);
  };

  // Handle clicking on an empty time slot
  const handleEmptySlotClick = (dayIndex: number, timeSlot: string) => {
    if (!weekDates || weekDates.length === 0) return;

    // Format the selected date and time for pre-filling
    const selectedDate = formatDateForTask(weekDates[dayIndex]);
    const selectedTime = timeSlot;

    setPreFilledData({
      selectedDate,
      selectedTime
    });

    setAddModalOpen(true);
  };

  // Handle task updated callback
  const handleTaskUpdated = () => {
    console.log('🎯 Timetable: handleTaskUpdated called');

    // Use TodoContext functions to invalidate timetable cache
    refetchTimetable(weekStartDate);

    // Also refetch our local data to ensure immediate updates
    refetchTasks();
  };

  // Handle add tasks callback
  const handleAddTasks = async (tasks: TaskData[]) => {
    console.log('🎯 Timetable: handleAddTasks called with', tasks.length, 'tasks');

    // Use TodoContext functions to invalidate timetable cache  
    refetchTimetable(weekStartDate);

    // Also refetch our local data to ensure immediate updates
    refetchTasks();
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
              <TableRow
                key={time}
                id={time === "7:00 AM" ? "seven-am-row" : undefined}
                className={shouldHighlightRow(time, weekDates) ? 'bg-muted/30' : ''}
              >
                <TableCell className="font-medium text-sm border-r sticky left-0 bg-background">
                  {time}
                </TableCell>
                {dayNames.map((dayName, index) => {
                  const isToday = isMounted && weekDates && weekDates[index].toDateString() === new Date().toDateString();
                  const tasks = weekDates.length > 0 ? getTasksForTimeSlot(index, time, weekDates) : [];

                  return (
                    <TableCell
                      key={`${dayName}-${time}`}
                      className={`h-12 border-r w-32 relative p-1 cursor-pointer ${shouldHighlightRow(time, weekDates)
                        ? ''
                        : 'hover:bg-muted/50'
                        } ${isToday ? 'bg-blue-50 dark:bg-blue-950/30' : ''}`}
                      onClick={(e) => {
                        // Only trigger empty slot click if we didn't click on a task
                        if (e.target === e.currentTarget) {
                          handleEmptySlotClick(index, time);
                        }
                      }}
                    >
                      {tasks.map((task, taskIndex) => {
                        const isFirstSlot = isFirstSlotForTask(task, time, index, weekDates);
                        const durationSlots = getTaskDurationSlots(task, generateTimeSlots());

                        // Only render the task in its first slot
                        if (!isFirstSlot) return null;

                        // Calculate positioning for overlapping tasks
                        const taskWidth = tasks.length > 1 ? `${100 / tasks.length}%` : '100%';
                        const taskLeft = tasks.length > 1 ? `${(taskIndex * 100) / tasks.length}%` : '0%';

                        // Get colors based on section and priority
                        const taskColors = getTaskColors(task.section, task.priority);

                        return (
                          <div
                            key={task.id}
                            className={`absolute inset-1 text-xs rounded px-1 py-0.5 cursor-pointer z-10 hover:opacity-80 border ${taskColors}`}
                            style={{
                              height: `${durationSlots * 48 - 8}px`,
                              minHeight: '40px',
                              width: taskWidth,
                              left: taskLeft,
                              // Add slight overlap for visual separation
                              marginRight: tasks.length > 1 ? '2px' : '0px'
                            }}
                            title={`${task.title}\n${task.start_time} - ${task.end_time}${tasks.length > 1 ? '\n⚠️ Overlapping with other tasks' : ''}`}
                            onMouseEnter={() => setHoveredTaskId(task.id)}
                            onMouseLeave={() => setHoveredTaskId(null)}
                            onClick={() => handleTaskClick(task)}
                          >
                            {tasks.length > 1 && (
                              <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-400 rounded-full text-xs flex items-center justify-center">
                                <span className="text-[8px] text-yellow-800">!</span>
                              </div>
                            )}
                            <div className="truncate text-center font-medium">{task.title}</div>
                            {tasks.length > 1 && (
                              <div className="text-[10px] opacity-75 text-center">
                                {task.start_time}
                              </div>
                            )}
                          </div>
                        );
                      })}
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

      {/* Modals */}
      <EditTaskModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        task={taskToEdit}
        onTaskUpdated={handleTaskUpdated}
      />

      <AddTaskModal
        open={addModalOpen}
        onOpenChange={(open) => {
          setAddModalOpen(open);
          if (!open) {
            setPreFilledData(undefined);
          }
        }}
        onAddTasks={handleAddTasks}
        preFilledData={preFilledData}
      />
    </div>
  )
}