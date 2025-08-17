import { TaskData } from "@/types/todoTypes";

export const hasDateTime = (task: TaskData) => !!(task.start_date || task.start_time || task.end_date || task.end_time);

export const getTimeInMinutes = (timeString?: string): number => {
  if (!timeString) return 0;

  if (timeString.includes('AM') || timeString.includes('PM')) {
    const [time, period] = timeString.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let hour24 = hours;

    if (period === 'PM' && hours !== 12) {
      hour24 += 12;
    } else if (period === 'AM' && hours === 12) {
      hour24 = 0;
    }

    return hour24 * 60 + (minutes || 0);
  } else {
    const [hours, minutes] = timeString.split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  }
};

export const getDateObject = (dateString?: string): Date => {
  if (!dateString) return new Date(0);
  return new Date(dateString);
};

export const getPriorityWeight = (priority?: string): number => {
  switch (priority) {
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
    default: return 0;
  }
};

export const getDateTimeComparison = <T extends TaskData>(task1: T, task2: T): number => {
  const date1 = getDateObject(task1.start_date);
  const date2 = getDateObject(task2.start_date);

  if (date1.getTime() !== date2.getTime()) {
    return date1.getTime() - date2.getTime();
  }

  const time1 = getTimeInMinutes(task1.start_time);
  const time2 = getTimeInMinutes(task2.start_time);

  if (time1 !== time2) {
    return time1 - time2;
  }

  const endDate1 = getDateObject(task1.end_date);
  const endDate2 = getDateObject(task2.end_date);

  if (endDate1.getTime() !== endDate2.getTime()) {
    return endDate1.getTime() - endDate2.getTime();
  }

  const endTime1 = getTimeInMinutes(task1.end_time);
  const endTime2 = getTimeInMinutes(task2.end_time);

  return endTime1 - endTime2;
};

// Core sorting algorithm that matches Daily section behavior
export const sortTasksTimeFirst = <T extends TaskData>(tasks: T[], order: 'asc' | 'desc' = 'asc'): T[] => {
  return tasks.sort((a, b) => {
    // First, sort by completion status (incomplete tasks first)
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    // Prioritize tasks with time
    const aHasTime = !!(a.start_time || a.end_time);
    const bHasTime = !!(b.start_time || b.end_time);

    if (aHasTime !== bHasTime) {
      return aHasTime ? -1 : 1; // Tasks with time first
    }

    if (aHasTime && bHasTime) {
      const timeA = a.start_time || '';
      const timeB = b.start_time || '';

      if (timeA && timeB) {
        return order === 'asc' ? timeA.localeCompare(timeB) : timeB.localeCompare(timeA);
      }

      if (timeA && !timeB) return -1;
      if (!timeA && timeB) return 1;
    }

    // For tasks without time, check if they have any date/time info
    const aHasDateTime = hasDateTime(a);
    const bHasDateTime = hasDateTime(b);

    if (aHasDateTime !== bHasDateTime) {
      return aHasDateTime ? -1 : 1;
    }

    // Fallback to title comparison
    return a.title.localeCompare(b.title);
  });
};

// Generic sorting function for different fields
export const sortTasksByField = <T extends TaskData>(tasks: T[], field: string, order: 'asc' | 'desc' = 'asc'): T[] => {
  return tasks.sort((a, b) => {

    let comparison = 0;

    switch (field) {
      case 'start_time':
        comparison = getTimeInMinutes(a.start_time) - getTimeInMinutes(b.start_time);
        if (comparison === 0) {
          comparison = getDateTimeComparison(a, b);
        }
        break;
      case 'start_date':
        comparison = getDateObject(a.start_date).getTime() - getDateObject(b.start_date).getTime();
        if (comparison === 0) {
          comparison = getDateTimeComparison(a, b);
        }
        break;
      case 'priority':
        comparison = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
        if (comparison === 0) {
          comparison = getDateTimeComparison(a, b);
        }
        break;
      case 'created_at':
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      default:
        comparison = 0;
    }

    return order === 'asc' ? comparison : -comparison;
  });
};