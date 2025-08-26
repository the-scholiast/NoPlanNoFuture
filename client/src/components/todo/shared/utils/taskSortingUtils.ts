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

// Generic sorting function for different fields
export const sortTasksByField = <T extends TaskData>(tasks: T[], field: string, order: 'asc' | 'desc' = 'asc'): T[] => {
  return tasks.sort((a, b) => {
    // First, sort by completion status (incomplete tasks first)
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    let comparison = 0;

    switch (field) {
      case 'start_time':
        // Prioritize tasks with any date/time info, then specifically those with time
        const aHasDateTime = hasDateTime(a);
        const bHasDateTime = hasDateTime(b);

        if (aHasDateTime !== bHasDateTime) {
          return aHasDateTime ? -1 : 1; // Tasks with any date/time first
        }

        // Among tasks with date/time, prioritize those with actual time
        const aHasTime = !!(a.start_time || a.end_time);
        const bHasTime = !!(b.start_time || b.end_time);

        if (aHasTime !== bHasTime) {
          return aHasTime ? -1 : 1; // Tasks with time first
        }

        comparison = getTimeInMinutes(a.start_time) - getTimeInMinutes(b.start_time);
        if (comparison === 0) {
          comparison = getDateTimeComparison(a, b);
        }
        break;
      case 'start_date':
        // Prioritize tasks with actual start_date values
        const aHasStartDate = !!a.start_date;
        const bHasStartDate = !!b.start_date;

        if (aHasStartDate !== bHasStartDate) {
          return aHasStartDate ? -1 : 1; // Tasks with start_date first
        }

        // If both have start_date or both don't, sort by start_date
        if (aHasStartDate && bHasStartDate) {
          comparison = getDateObject(a.start_date).getTime() - getDateObject(b.start_date).getTime();
        } else {
          // For tasks without start_date, fall back to other date/time comparisons
          comparison = getDateTimeComparison(a, b);
        }
        break;
      case 'priority':
        // For priority, still check date/time presence for secondary sorting
        const aHasPriorityDateTime = hasDateTime(a);
        const bHasPriorityDateTime = hasDateTime(b);

        comparison = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
        if (comparison === 0) {
          // If same priority, prioritize tasks with date/time
          if (aHasPriorityDateTime !== bHasPriorityDateTime) {
            comparison = aHasPriorityDateTime ? -1 : 1;
          } else {
            comparison = getDateTimeComparison(a, b);
          }
        }
        break;
      case 'created_at':
        // For created_at, still check date/time presence for secondary sorting
        const aHasCreatedDateTime = hasDateTime(a);
        const bHasCreatedDateTime = hasDateTime(b);

        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        if (comparison === 0) {
          // If same creation time, prioritize tasks with date/time
          if (aHasCreatedDateTime !== bHasCreatedDateTime) {
            comparison = aHasCreatedDateTime ? -1 : 1;
          } else {
            comparison = getDateTimeComparison(a, b);
          }
        }
        break;
      default:
        // For unknown fields, just prioritize tasks with date/time and fallback to title
        const aHasDefaultDateTime = hasDateTime(a);
        const bHasDefaultDateTime = hasDateTime(b);

        if (aHasDefaultDateTime !== bHasDefaultDateTime) {
          comparison = aHasDefaultDateTime ? -1 : 1;
        } else {
          comparison = a.title.localeCompare(b.title);
        }
    }

    return order === 'asc' ? comparison : -comparison;
  });
};