// Contains the keys of all query keys for caches
export const todoKeys = {
  all: ['todos'] as const,
  today: ['recurring-todos', 'today'] as const,
  upcoming: ['upcoming'] as const,
  completed: ['completed-tasks'] as const,
  incomplete: ['incomplete-tasks'] as const,
  deleted: ['deleted-tasks'] as const,
  timetable: {
    tasks: ['timetable-tasks'] as const,
    week: (weekStartDate: string) => ['timetable-week', weekStartDate] as const,
    allWeeks: ['timetable-week'] as const,
  },
  monthTasks: (year: number, month: number) => ['month-tasks', year, month] as const,
  calendar: (year: number) => ['todos', 'calendar', year] as const,
}