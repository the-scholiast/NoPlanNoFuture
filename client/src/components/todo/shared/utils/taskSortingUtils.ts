import { parseToLocalDate } from "@/lib/utils/dateUtils";
import { TaskData } from "@/types/todoTypes";

export const hasDateTime = (task: TaskData) => !!(task.start_date || task.start_time || task.end_date || task.end_time);

export const getTimeInMinutes = (timeString?: string): number => {
  if (!timeString) return 0;
  const [hours, minutes] = timeString.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
};

export const sortTasksByDateTimeAndCompletion = (tasks: TaskData[]) => {
  return tasks.sort((a, b) => {
    // First, sort by completion status (incomplete tasks first)
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }

    // For incomplete tasks, prioritize those with dates/times first
    const aHasDateTime = hasDateTime(a);
    const bHasDateTime = hasDateTime(b);

    if (aHasDateTime !== bHasDateTime) {
      return aHasDateTime ? -1 : 1;
    }

    // Sort by date then time
    const dateA = a.start_date || a.created_at?.split('T')[0] || '';
    const dateB = b.start_date || b.created_at?.split('T')[0] || '';

    const dateObjA = dateA ? parseToLocalDate(dateA.split('T')[0]) : new Date(0);
    const dateObjB = dateB ? parseToLocalDate(dateB.split('T')[0]) : new Date(0);

    if (dateObjA.getTime() !== dateObjB.getTime()) {
      return dateObjA.getTime() - dateObjB.getTime();
    }

    const timeA = a.start_time || '';
    const timeB = b.start_time || '';

    if (timeA && timeB) {
      return timeA.localeCompare(timeB);
    }

    if (timeA && !timeB) return -1;
    if (!timeA && timeB) return 1;

    return a.title.localeCompare(b.title);
  });
};

export const applyDefaultTaskSort = (tasks: TaskData[]) => {
  const completedTasks = tasks.filter(task => task.completed);
  const incompleteTasksWithDateTime = tasks.filter(task => !task.completed && hasDateTime(task));
  const incompleteTasksWithoutDateTime = tasks.filter(task => !task.completed && !hasDateTime(task));

  return [
    ...sortTasksByDateTimeAndCompletion(incompleteTasksWithDateTime),
    ...sortTasksByDateTimeAndCompletion(incompleteTasksWithoutDateTime),
    ...sortTasksByDateTimeAndCompletion(completedTasks)
  ];
};