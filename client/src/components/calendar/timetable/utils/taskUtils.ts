import { formatDateString } from '@/lib/utils/dateUtils';
import { convertTo24Hour } from './timeUtils';

// Helper to get tasks for a specific time slot
export const getTasksForTimeSlot = (
  dayIndex: number, 
  timeSlot: string, 
  weekDates: Date[], 
  scheduledTasks: any[]
) => {
  if (!weekDates || !scheduledTasks) return [];

  const dayDate = formatDateString(weekDates[dayIndex]);
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

    return taskStartMinutes < slotEndMinutes && taskEndMinutes > slotStartMinutes;
  });
};

// Helper to calculate task duration in time slots
export const getTaskDurationSlots = (task: any, timeSlots: string[]) => {
  if (!task.start_time || !task.end_time) return 1;

  const startTime24 = convertTo24Hour(task.start_time);
  const endTime24 = convertTo24Hour(task.end_time);

  const [startHours, startMins] = startTime24.split(':').map(Number);
  const [endHours, endMins] = endTime24.split(':').map(Number);

  const startMinutes = startHours * 60 + startMins;
  const endMinutes = endHours * 60 + endMins;

  const durationMinutes = endMinutes - startMinutes;
  return Math.ceil(durationMinutes / 30);
};

// Helper to check if this is the first slot for a task
export const isFirstSlotForTask = (
  task: any, 
  currentTime: string, 
) => {
  if (!task.start_time) return true;

  const currentTime24 = convertTo24Hour(currentTime);
  const taskStartTime24 = convertTo24Hour(task.start_time);

  const [currentHours, currentMins] = currentTime24.split(':').map(Number);
  const [taskStartHours, taskStartMins] = taskStartTime24.split(':').map(Number);

  const currentMinutes = currentHours * 60 + currentMins;
  const taskStartMinutes = taskStartHours * 60 + taskStartMins;

  return currentMinutes <= taskStartMinutes && taskStartMinutes < currentMinutes + 30;
};

// Check which tasks are overlapping
export const detectTimeConflicts = (dayIndex: number, weekDates: Date[], scheduledTasks: any[]) => {
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

// Determine if the two tasks are overlapping
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