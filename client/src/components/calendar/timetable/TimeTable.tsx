'use client'

import { Card } from "../../ui/card"
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "../../ui/table"
import EditTaskModal from '@/components/todo/EditTaskModal'
import AddTaskModal from '@/components/todo/global/AddTaskModal'
import { getTaskColors } from '@/components/todo/shared/utils/sectionUtils'
import {
  useTimetableData,
  useTimetableState,
  useTimetableScrolling,
  useTimetableModalHandlers
} from './hooks'
import {
  generateTimeSlots,
  getTasksForTimeSlot,
  getTaskDurationSlots,
  isFirstSlotForTask,
  getDayHeader,
  shouldHighlightRow
} from './utils'

interface TimeTableProps {
  selectedDate?: Date
}

export default function TimeTable({ selectedDate }: TimeTableProps) {
  // Data management
  const {
    currentDate,
    isMounted,
    weekDates,
    weekStartDate,
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
    weekStartDate,
    handleDataRefresh
  });

  // Define dayNames
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Generate all time slots
  const timeSlots = generateTimeSlots();

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
                const headerData = getDayHeader(dayName, index, weekDates, isMounted);
                const isToday = isMounted && weekDates && weekDates[index].toDateString() === new Date().toDateString();

                return (
                  <TableHead
                    key={dayName}
                    className={`text-center w-32 bg-background ${isToday ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''}`}
                  >
                    <div className="flex flex-col items-center">
                      <div>{headerData.dayName}</div>
                      <div className={`text-xs font-normal ${headerData.isToday ? 'text-blue-600 font-medium' : 'text-muted-foreground'}`}>
                        {headerData.dateDisplay}
                      </div>
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {timeSlots.map((time) => (
              <TableRow
                key={time}
                id={time === "7:00 AM" ? "seven-am-row" : undefined}
                className={shouldHighlightRow(time, weekDates, hoveredTaskId, scheduledTasks, dayNames) ? 'bg-muted/30' : ''}
              >
                <TableCell className="font-medium text-sm border-r sticky left-0 bg-background">
                  {time}
                </TableCell>
                {dayNames.map((dayName, index) => {
                  const isToday = isMounted && weekDates && weekDates[index].toDateString() === new Date().toDateString();
                  const tasks = weekDates.length > 0 ? getTasksForTimeSlot(index, time, weekDates, scheduledTasks) : [];

                  return (
                    <TableCell
                      key={`${dayName}-${time}`}
                      className={`h-9 border-r w-32 relative cursor-pointer ${shouldHighlightRow(time, weekDates, hoveredTaskId, scheduledTasks, dayNames)
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
                        const durationSlots = getTaskDurationSlots(task, timeSlots);

                        if (!isFirstSlot) return null;

                        const taskWidth = tasks.length > 1 ? `${100 / tasks.length}%` : '100%';
                        const taskLeft = tasks.length > 1 ? `${(taskIndex * 100) / tasks.length}%` : '0%';
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