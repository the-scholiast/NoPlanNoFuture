'use client'

import { Card } from "../ui/card"
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "../ui/table"
import { Button } from "../ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useQuery } from '@tanstack/react-query'
import { getSharedCalendarTasks } from '@/lib/api/calendarShareApi'
import { formatDateString } from '@/lib/utils/dateUtils'
import { getTaskColors, getCustomColorStyle } from '@/components/todo/shared/utils/sectionUtils'
import { useRouter } from 'next/navigation'
import {
  generateTimeSlots,
  getTasksForTimeSlot,
  getTaskDurationSlots,
  isFirstSlotForTask,
  getDayHeader,
  convertTimeSlotTo24Hour,
} from './timetable/utils'
import { useEffect, useState } from 'react'
import { useWorkHourTotals } from './timetable/hooks/useWorkHourTotals';

interface SharedTimeTableProps {
  selectedDate: Date
  shareToken: string
}

export default function SharedTimeTable({ selectedDate, shareToken }: SharedTimeTableProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [currentDate, setCurrentDate] = useState(selectedDate)
  const router = useRouter()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    setCurrentDate(selectedDate)
  }, [selectedDate])

  // Get the current week's dates
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

  const weekDates = isMounted && currentDate ? getWeekDates(currentDate) : [];
  const weekStartDate = weekDates.length > 0 ? formatDateString(weekDates[0]) : '';
  const weekEndDate = weekDates.length > 0 ? formatDateString(weekDates[6]) : '';

  // Navigation functions
  const navigatePrevious = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() - 7)
    updateURL(newDate)
  }

  const navigateNext = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + 7)
    updateURL(newDate)
  }

  const updateURL = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()

    const params = new URLSearchParams()
    params.set('year', year.toString())
    params.set('month', month.toString())
    params.set('day', day.toString())

    // Update URL while keeping the same share token
    router.push(`/calendar/shared/${shareToken}?${params.toString()}`)
  }

  // Get display text for current week
  const getWeekDisplayText = (): string => {
    if (weekDates.length === 0) return 'Loading...'

    const monday = weekDates[0]
    const sunday = weekDates[6]

    // Format based on whether week spans months
    if (monday.getMonth() === sunday.getMonth()) {
      return `${monday.toLocaleString('default', { month: 'long' })} ${monday.getDate()}-${sunday.getDate()}, ${monday.getFullYear()}`
    } else {
      return `${monday.toLocaleString('default', { month: 'long' })} ${monday.getDate()} - ${sunday.toLocaleString('default', { month: 'long' })} ${sunday.getDate()}, ${monday.getFullYear()}`
    }
  }

  // Fetch shared calendar tasks
  const { data: scheduledTasks = [], isLoading: isLoadingTasks, error } = useQuery({
    queryKey: ['shared-calendar-timetable', shareToken, weekStartDate, weekEndDate],
    queryFn: () => getSharedCalendarTasks(shareToken, weekStartDate, weekEndDate),
    enabled: !!shareToken && !!weekStartDate && !!weekEndDate
  });

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const allTimeSlots = generateTimeSlots();
  const timeSlots = allTimeSlots;
  const { weekHours, perDayThisWeek } = useWorkHourTotals(weekDates, scheduledTasks);
  const todayIndex = weekDates.findIndex(
    d => d.toDateString() === new Date().toDateString()
  );


  if (error) {
    return (
      <Card className="p-8 text-center">
        <h1 className="text-xl font-semibold mb-2">Unable to load shared calendar</h1>
        <p className="text-muted-foreground">
          {(error as Error).message || 'This link may be invalid or expired.'}
        </p>
      </Card>
    )
  }

  return (
    <div className="w-full flex flex-col" style={{ height: 'calc(100vh - 130px)' }}>
      {/* Header with Navigation */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold">Shared Calendar</h1>
          <p className="text-sm text-muted-foreground">
            Total today: {todayIndex >= 0 ? perDayThisWeek[todayIndex]?.toFixed(1) : '0.0'} h
            Total this week: {weekHours.toFixed(1)} h
          </p>
          
        </div>

        {/* Week Navigation */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={navigatePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="font-medium text-center min-w-[200px]">
            {getWeekDisplayText()}
          </span>
          <Button variant="ghost" size="sm" onClick={navigateNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="flex-1 overflow-auto relative min-h-0 flex flex-col py-0 gap-0">
        <Table className="w-full overflow-visible">
          <TableHeader className="sticky top-0 bg-background z-30">
            <TableRow className="relative z-30">
              <TableHead className="w-24 border-r bg-background relative z-30">Time</TableHead>
              {dayNames.map((dayName, index) => {
                const headerData = weekDates.length > 0 ? getDayHeader(dayName, index, weekDates, isMounted) : {
                  dayName,
                  dateDisplay: '',
                  isToday: false
                };

                return (
                  <TableHead
                    key={dayName}
                    className={`text-center w-32 bg-background relative z-30 ${headerData.isToday ?
                      'text-blue-600 dark:text-blue-400 font-semibold' : ''}`}
                  >
                    <div className="flex flex-col items-center">
                      <div>{headerData.dayName}</div>
                      <div className={`text-xs font-normal ${headerData.isToday ?
                        'text-blue-600 font-medium' : 'text-muted-foreground'}`}>
                        {headerData.dateDisplay} <span className="font-medium text-gray-400">[{perDayThisWeek[index]?.toFixed(1) || '0.0'}h]</span>
                      </div>
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {timeSlots.map((time, timeIndex) => {
              // Convert time to 24-hour format and extract minutes (calculate once)
              const time24Hour = convertTimeSlotTo24Hour(time);
              const [, minutes] = time24Hour.split(':').map(Number);

              // Check if this time slot should display a label (only at 00 and 30 minutes)
              const shouldShowTimeLabel = minutes === 0 || minutes === 30;

              // Check if this time slot ends at 15 or 45 minutes (should not have bottom border)
              const endMinutes = (minutes + 15) % 60;
              const removeBottomBorder = endMinutes === 15 || endMinutes === 45;

              // Check if this is the first row of a 30-minute block (should merge with next row)
              const shouldMergeTimeCell = shouldShowTimeLabel;
              const nextTimeSlot = timeSlots[timeIndex + 1];
              const hasNextSlot = nextTimeSlot !== undefined;

              return (
                <TableRow
                  key={time}
                  className={`h-3 ${removeBottomBorder ? 'border-b-0' : ''}`}
                >
                  {shouldMergeTimeCell && hasNextSlot ? (
                    <TableCell 
                      rowSpan={2}
                      className={`font-medium text-xs border-r sticky left-0 bg-background p-0.5 leading-none ${removeBottomBorder ? 'border-b-0' : ''}`}
                      style={{ verticalAlign: 'middle' }}
                    >
                      {time}
                    </TableCell>
                  ) : !shouldMergeTimeCell ? null : (
                    <TableCell className={`font-medium text-[10px] border-r sticky left-0 bg-background p-0 h-3 leading-none ${removeBottomBorder ? 'border-b-0' : ''}`} style={{ verticalAlign: 'middle' }}>
                      {time}
                    </TableCell>
                  )}
                  {dayNames.map((dayName, index) => {
                    const isToday = isMounted && weekDates && weekDates[index].toDateString() === new Date().toDateString();
                    const tasks = weekDates.length > 0 ? getTasksForTimeSlot(index, time, weekDates, scheduledTasks) : [];

                    return (
                      <TableCell
                        key={`${dayName}-${time}`}
                        className={`h-3 border-r w-32 relative p-0 align-top leading-none overflow-visible ${removeBottomBorder ? 'border-b-0' : ''} ${isToday ? 'bg-blue-50 dark:bg-blue-950/30' : ''}`}
                      >
                        {tasks.map((task, taskIndex) => {
                          const isFirstSlot = isFirstSlotForTask(task, time);
                          const durationSlots = getTaskDurationSlots(task);

                          if (!isFirstSlot) return null;

                          const taskWidth = tasks.length > 1 ? `${100 / tasks.length}%` : '100%';
                          const taskLeft = tasks.length > 1 ? `${(taskIndex * 100) / tasks.length}%` : '0%';
                          const taskColors = getTaskColors(task.section, task.priority, task.color);
                          const customColorStyle = getCustomColorStyle(task.color);

                          return (
                            <div
                              key={task.id}
                              className={`absolute top-0 text-[10px] rounded cursor-pointer z-10 opacity-80 hover:opacity-90 border ${taskColors}`}
                              style={{
                                height: `${durationSlots * 12}px`,
                                minHeight: '0px',
                                width: taskWidth,
                                left: taskLeft,
                                marginRight: tasks.length > 1 ? '2px' : '0px',
                                ...customColorStyle
                              }}
                              title={`${task.title}\n${task.start_time} - ${task.end_time}`}
                            >
                              <div className="px-0.5 py-0.5 flex flex-col items-center justify-center h-full">
                                <div className="truncate text-center font-semibold text-[12px] text-gray-900 dark:text-white leading-tight">{task.title}</div>
                                {tasks.length > 1 && (
                                  <div className="text-[10px] opacity-55 text-center leading-tight">
                                    {task.start_time}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {isLoadingTasks && index === 0 && time === timeSlots[0] && (
                          <div className="text-xs text-muted-foreground">Loading...</div>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}