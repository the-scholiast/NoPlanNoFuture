import { getTasksForTimeSlot } from './taskUtils';

// Generate header content for each day
export const getDayHeader = (dayName: string, index: number, weekDates?: Date[], isMounted?: boolean) => {
  if (!isMounted || !weekDates) {
    return {
      dayName,
      dateDisplay: '--',
      isToday: false
    };
  }

  const date = weekDates[index];
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();

  return {
    dayName,
    dateDisplay: date.getDate().toString(),
    isToday
  };
};

// Add helper function to check if ANY cell in this row contains the hovered task
export const shouldHighlightRow = (
  time: string,
  weekDates: Date[],
  hoveredTaskId: string | null,
  scheduledTasks: any[],
  dayNames: string[]
) => {
  if (!hoveredTaskId || !weekDates || !scheduledTasks) return false;

  // Check if any day in this time slot contains the hovered task
  for (let dayIndex = 0; dayIndex < dayNames.length; dayIndex++) {
    const tasks = getTasksForTimeSlot(dayIndex, time, weekDates, scheduledTasks);
    if (tasks.some(task => task.id === hoveredTaskId)) {
      return true;
    }
  }
  return false;
};