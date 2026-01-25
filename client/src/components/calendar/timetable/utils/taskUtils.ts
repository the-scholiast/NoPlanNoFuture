import { formatDateString } from '@/lib/utils/dateUtils';
import { convertTimeSlotTo24Hour } from './timeUtils';
import { TaskData } from '@/types/todoTypes';
import { getTimeInMinutes } from '@/components/todo';

// Helper to get tasks for a specific time slot
export const getTasksForTimeSlot = (
  dayIndex: number,
  timeSlot: string,
  weekDates: Date[],
  scheduledTasks: TaskData[]
) => {
  if (!weekDates || !scheduledTasks) return [];

  const dayDate = formatDateString(weekDates[dayIndex]);
  const slotTime = convertTimeSlotTo24Hour(timeSlot);

  return scheduledTasks.filter(task => {
    const taskDate = task.instance_date || task.start_date;
    if (taskDate !== dayDate) return false;

    if (!task.start_time || !task.end_time) return false;

    const taskStart = task.start_time;
    const taskEnd = task.end_time;

    // Convert slot time to minutes for easier comparison
    const [slotHours, slotMinutes] = slotTime.split(':').map(Number);
    const slotStartMinutes = slotHours * 60 + slotMinutes;
    const slotEndMinutes = slotStartMinutes + 15;

    // Convert task times to minutes
    const [taskStartHours, taskStartMins] = taskStart.split(':').map(Number);
    const [taskEndHours, taskEndMins] = taskEnd.split(':').map(Number);
    const taskStartMinutes = taskStartHours * 60 + taskStartMins;
    const taskEndMinutes = taskEndHours * 60 + taskEndMins;

    return taskStartMinutes < slotEndMinutes && taskEndMinutes > slotStartMinutes;
  });
};

// Helper to calculate task duration in time slots
export const getTaskDurationSlots = (task: TaskData) => {
  if (!task.start_time || !task.end_time) return 1;

  const startTime24 = convertTimeSlotTo24Hour(task.start_time);
  const endTime24 = convertTimeSlotTo24Hour(task.end_time);

  const [startHours, startMins] = startTime24.split(':').map(Number);
  const [endHours, endMins] = endTime24.split(':').map(Number);

  const startMinutes = startHours * 60 + startMins;
  const endMinutes = endHours * 60 + endMins;

  const durationMinutes = endMinutes - startMinutes;
  return Math.ceil(durationMinutes / 15);
};

// Helper to check if this is the first slot for a task
export const isFirstSlotForTask = (
  task: TaskData,
  currentTime: string,
) => {
  if (!task.start_time) return true;

  const currentTime24 = convertTimeSlotTo24Hour(currentTime);
  const taskStartTime24 = convertTimeSlotTo24Hour(task.start_time);

  const [currentHours, currentMins] = currentTime24.split(':').map(Number);
  const [taskStartHours, taskStartMins] = taskStartTime24.split(':').map(Number);

  const currentMinutes = currentHours * 60 + currentMins;
  const taskStartMinutes = taskStartHours * 60 + taskStartMins;

  return currentMinutes <= taskStartMinutes && taskStartMinutes < currentMinutes + 15;
};

// Check which tasks are overlapping
export const detectTimeConflicts = (dayIndex: number, weekDates: Date[], scheduledTasks: TaskData[]) => {
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
const tasksOverlap = (task1: TaskData, task2: TaskData): boolean => {
  // If either task doesn't have both start and end times, they don't overlap
  if (!task1.start_time || !task1.end_time || !task2.start_time || !task2.end_time) {
    return false;
  }

  const task1Start = getTimeInMinutes(task1.start_time);
  const task1End = getTimeInMinutes(task1.end_time);
  const task2Start = getTimeInMinutes(task2.start_time);
  const task2End = getTimeInMinutes(task2.end_time);

  return task1Start < task2End && task2Start < task1End;
};

// Get all tasks that overlap with a given task from the day's tasks
export const getOverlappingTasksForTask = (
  task: TaskData,
  dayTasks: TaskData[]
): TaskData[] => {
  const overlapping = dayTasks.filter(otherTask => {
    if (otherTask.id === task.id) return false;
    const overlaps = tasksOverlap(task, otherTask);
    if (overlaps) {
      console.log(`[CALENDAR OVERLAP] "${task.title}" (${task.start_time}-${task.end_time}) overlaps with "${otherTask.title}" (${otherTask.start_time}-${otherTask.end_time})`);
    }
    return overlaps;
  });
  
  if (overlapping.length > 0) {
    console.log(`[CALENDAR GROUP] Task "${task.title}" has ${overlapping.length} overlapping task(s):`, overlapping.map(t => `"${t.title}"`).join(', '));
  }
  
  return overlapping;
};

// Get layout info for a task based on its overlapping group
// Simple logic: if tasks overlap, they share 50% each (minimum concept)
export const getTaskLayoutForOverlappingGroup = (
  task: TaskData,
  dayTasks: TaskData[]
): { width: string; left: string } => {
  // Get all tasks that directly overlap with this task
  const overlappingTasks = getOverlappingTasksForTask(task, dayTasks);
  
  // If no overlapping tasks, take full width
  if (overlappingTasks.length === 0) {
    return { width: '100%', left: '0%' };
  }

  // Simple logic: if there are overlapping tasks, use 50% width
  // This keeps the minimum concept - tasks that overlap share 50% each
  const hasOverlapping = overlappingTasks.length > 0;
  const width = hasOverlapping ? '50%' : '100%';
  
  // Find position: if this task starts before the first overlapping task, it's on the left (0%)
  // Otherwise, it's on the right (50%)
  let left = '0%';
  if (hasOverlapping && task.start_time) {
    const taskStart = getTimeInMinutes(task.start_time);
    const overlappingStarts = overlappingTasks
      .filter(t => t.start_time)
      .map(t => getTimeInMinutes(t.start_time))
      .sort((a, b) => a - b);
    
    if (overlappingStarts.length > 0 && taskStart > overlappingStarts[0]) {
      left = '50%';
    }
  }

  console.log(`[CALENDAR LAYOUT] Task "${task.title}": hasOverlapping=${hasOverlapping}, width=${width}, left=${left}, overlapping tasks:`, overlappingTasks.map(t => `"${t.title}" (${t.start_time}-${t.end_time})`).join(', '));

  return { width, left };
};