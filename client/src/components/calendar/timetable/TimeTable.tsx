'use client'

import { Card } from "../../ui/card"
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "../../ui/table"
import { Button } from "../../ui/button"
import { Settings } from "lucide-react"
import EditTaskModal from '@/components/todo/EditTaskModal'
import AddTaskModal from '@/components/todo/global/AddTaskModal'
import { getTaskColors, getCustomColorStyle } from '@/components/todo/shared/utils/sectionUtils'
import {
  useTimetableData,
  useTimetableState,
  useTimetableScrolling,
  useTimetableModalHandlers
} from './hooks'
import { useWorkHourTotals } from './hooks/useWorkHourTotals'
import {
  generateTimeSlots,
  getTasksForTimeSlot,
  getTaskDurationSlots,
  isFirstSlotForTask,
  getDayHeader,
  shouldHighlightRow,
  filterHiddenTimeSlots
} from './utils'
import { convertTimeSlotTo24Hour } from './utils/timeUtils'
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../ui/dialog"
import { Label } from "../../ui/label"
import { Input } from "../../ui/input"
import { Switch } from "../../ui/switch"
import { CalendarShareDialog } from '@/components/calendar/CalendarShareDialog'


interface HiddenTimeRange {
  start: string
  end: string
  enabled: boolean
}

interface TimeTableProps {
  selectedDate?: Date
}

export default function TimeTable({ selectedDate }: TimeTableProps) {
  // Data management
  const {
    isMounted,
    weekDates,
    scheduledTasks,
    isLoadingTasks,
    tasksError,
    handleDataRefresh
  } = useTimetableData({ selectedDate });

  // State management
  const {
    hoveredTaskId,
    setHoveredTaskId,
    editModalOpen,
    setEditModalOpen,
    addModalOpen,
    setAddModalOpen,
    taskToEdit,
    setTaskToEdit,
    preFilledData,
    setPreFilledData
  } = useTimetableState();

  // Hidden time ranges state
  const [hiddenTimeRanges, setHiddenTimeRanges] = useState<HiddenTimeRange[]>([])
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Scrolling functionality
  const { tableRef } = useTimetableScrolling();

  // Modal handlers
  const {
    handleTaskClick,
    handleEmptySlotClick,
    handleTaskUpdated,
    handleAddTasks
  } = useTimetableModalHandlers({
    editModalOpen,
    addModalOpen,
    setTaskToEdit,
    setEditModalOpen,
    setAddModalOpen,
    setPreFilledData,
    weekDates,
    handleDataRefresh
  });

  // Get work hour totals for each day
  const { perDayThisWeek } = useWorkHourTotals(weekDates, scheduledTasks);

  // Load hidden time ranges from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('timetable-hidden-ranges')
    if (saved) {
      try {
        setHiddenTimeRanges(JSON.parse(saved))
      } catch (e) {
        console.warn('Failed to parse hidden time ranges:', e)
      }
    }
  }, [])

  // Save hidden time ranges to localStorage
  const saveHiddenTimeRanges = (ranges: HiddenTimeRange[]) => {
    setHiddenTimeRanges(ranges)
    localStorage.setItem('timetable-hidden-ranges', JSON.stringify(ranges))
  }

  // Add new hidden time range
  const addHiddenTimeRange = () => {
    const newRange: HiddenTimeRange = {
      start: '02:00',
      end: '08:00',
      enabled: true
    }
    saveHiddenTimeRanges([...hiddenTimeRanges, newRange])
  }

  // Update hidden time range
  const updateHiddenTimeRange = (index: number, field: keyof HiddenTimeRange, value: string | boolean) => {
    const updated = [...hiddenTimeRanges]
    updated[index] = { ...updated[index], [field]: value }
    saveHiddenTimeRanges(updated)
  }

  // Remove hidden time range
  const removeHiddenTimeRange = (index: number) => {
    const updated = hiddenTimeRanges.filter((_, i) => i !== index)
    saveHiddenTimeRanges(updated)
  }

  // Define dayNames
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Generate all time slots and filter hidden ones
  const allTimeSlots = generateTimeSlots();
  const timeSlots = filterHiddenTimeSlots(allTimeSlots, hiddenTimeRanges);

  return (
    <div className="w-full flex flex-col" style={{ height: 'calc(100vh - 130px)' }}>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <CalendarShareDialog />
        </div>
        {tasksError && (
          <div className="text-red-500 text-sm px-4 py-2 bg-red-50 rounded">
            Error loading tasks: {tasksError.message}
          </div>
        )}
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto">
              <Settings className="h-4 w-4 mr-2" />
              Hide Times
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Hide Time Ranges</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Configure time ranges to hide from the timetable view.
              </div>
              {hiddenTimeRanges.map((range, index) => (
                <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg">
                  <Switch
                    checked={range.enabled}
                    onCheckedChange={(checked: boolean) => updateHiddenTimeRange(index, 'enabled', checked)}
                  />
                  <div className="flex-1 flex items-center space-x-2">
                    <div className="flex-1">
                      <Label htmlFor={`start-${index}`} className="text-xs">Start</Label>
                      <Input
                        id={`start-${index}`}
                        type="time"
                        value={range.start}
                        onChange={(e) => updateHiddenTimeRange(index, 'start', e.target.value)}
                        className="h-8"
                      />
                    </div>
                    <div className="text-sm">to</div>
                    <div className="flex-1">
                      <Label htmlFor={`end-${index}`} className="text-xs">End</Label>
                      <Input
                        id={`end-${index}`}
                        type="time"
                        value={range.end}
                        onChange={(e) => updateHiddenTimeRange(index, 'end', e.target.value)}
                        className="h-8"
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeHiddenTimeRange(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </Button>
                </div>
              ))}
              <Button onClick={addHiddenTimeRange} variant="outline" className="w-full">
                Add Time Range
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Card className="flex-1 overflow-auto relative min-h-0 flex flex-col py-0 gap-0 justify-center">
        <Table ref={tableRef} className="w-full overflow-visible">
          <TableHeader className="sticky top-0 bg-background z-30">
            <TableRow className="relative z-30 border-b">
              <TableHead className="w-24 border-r border-b bg-background relative z-30">Time</TableHead>
              {dayNames.map((dayName, index) => {
                const headerData = getDayHeader(dayName, index, weekDates, isMounted);
                const isToday = isMounted && weekDates && weekDates[index].toDateString() === new Date().toDateString();
                const dayWorkHours = perDayThisWeek[index] || 0;

                return (
                  <TableHead
                    key={dayName}
                    className={`text-center w-32 border-r border-b bg-background relative z-30 ${isToday ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''}`}
                  >
                    <div className="flex flex-col items-center">
                      <div>{headerData.dayName}</div>
                      <div className={`text-xs font-normal ${headerData.isToday ? 'text-blue-600 font-medium' : 'text-muted-foreground'}`}>
                        {headerData.dateDisplay} <span className="font-medium text-gray-400">[{dayWorkHours.toFixed(1)}h]</span>
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
                  id={time === "7:00 AM" ? "seven-am-row" : time === "8:00 AM" ? "eight-am-row" : undefined}
                  className={`h-3 ${shouldHighlightRow(time, weekDates, hoveredTaskId, scheduledTasks, dayNames) ? 'bg-muted/30' : ''} ${removeBottomBorder ? '' : 'border-b'}`}
                >
                  {shouldMergeTimeCell && hasNextSlot ? (
                    <TableCell 
                      rowSpan={2}
                      className={`font-medium text-xs border-r border-b sticky left-0 bg-background p-0.5 leading-none z-20`}
                      style={{ verticalAlign: 'middle' }}
                    >
                      {time}
                    </TableCell>
                  ) : !shouldMergeTimeCell ? null : (
                    <TableCell className={`font-medium text-[10px] border-r border-b sticky left-0 bg-background p-0 h-3 leading-none z-20`} style={{ verticalAlign: 'middle' }}>
                      {time}
                    </TableCell>
                  )}
                  {dayNames.map((dayName, index) => {
                    const isToday = isMounted && weekDates && weekDates[index].toDateString() === new Date().toDateString();
                    const tasks = weekDates.length > 0 ? getTasksForTimeSlot(index, time, weekDates, scheduledTasks) : [];

                    return (
                      <TableCell
                        key={`${dayName}-${time}`}
                        className={`h-3 border-r border-b w-32 relative cursor-pointer p-0 align-top leading-none overflow-visible ${shouldHighlightRow(time, weekDates, hoveredTaskId, scheduledTasks, dayNames)
                          ? ''
                          : 'hover:bg-muted/50'
                          } ${isToday ? 'bg-blue-50 dark:bg-blue-950/30' : ''}`}
                        onClick={(e) => {
                          if (e.target === e.currentTarget) {
                            handleEmptySlotClick(index, time);
                          }
                        }}
                      >
                        {tasks.map((task, taskIndex) => {
                          const isFirstSlot = isFirstSlotForTask(task, time);
                          const durationSlots = getTaskDurationSlots(task );

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
                                height: `${Math.max(durationSlots * 12, 11)}px`,
                                minHeight: '11px',
                                width: taskWidth,
                                left: taskLeft,
                                marginRight: tasks.length > 1 ? '2px' : '0px',
                                ...customColorStyle
                              }}
                              title={`${task.title}\n${task.start_time} - ${task.end_time}`}
                              onMouseEnter={() => setHoveredTaskId(task.id)}
                              onMouseLeave={() => setHoveredTaskId(null)}
                              onClick={() => handleTaskClick(task)}
                            >
                              <div className="px-0 py-0 flex flex-col items-center justify-center h-full overflow-hidden">
                                <div className={`truncate text-center font-semibold text-gray-900 dark:text-white leading-tight w-full ${
                                  durationSlots <= 1 ? 'text-[8px]' : 'text-[12px]'
                                }`}>{task.title}</div>
                                {tasks.length > 1 && durationSlots > 1 && (
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