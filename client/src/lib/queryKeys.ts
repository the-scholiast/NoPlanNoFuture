// Contains the keys of all query keys for caches
export const todoKeys = {
  all: ['todos'] as const,
  today: ['recurring-todos', 'today'] as const,
  upcoming: ['recurring-todos', 'upcoming'] as const,
  completed: ['completed-tasks'] as const,
  incomplete: ['incomplete-tasks'] as const,
  timetable: {
    tasks: ['timetable-tasks'] as const,
    week: (weekStartDate: string) => ['timetable-week', weekStartDate] as const,
    allWeeks: ['timetable-week'] as const,
  }
}