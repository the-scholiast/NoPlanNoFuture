'use client'

import { TodoBoard, CompletedTasks, IncompleteTasks } from '@/components/todo';
import { useTodo } from '@/contexts/TodoContext';

export default function Page() {
  const { allTasks, dailyTasks, todayTasksWithRecurring, upcomingTasksWithRecurring } = useTodo();

  // Create a key that changes when task completion status changes (for CompletedTasks)
  const completedTasksKey = `completed-${allTasks
    .map(task => `${task.id}-${task.completed}-${task.completed_at}`)
    .join('|')}`;

  // Create a key for TodoBoard based on the tasks it actually displays
  const todoBoardKey = `todoboard-${[
    ...dailyTasks.map(task => `daily-${task.id}-${task.title}-${task.completed}-${task.updated_at || task.created_at}`),
    ...todayTasksWithRecurring.map(task => `today-${task.id}-${task.title}-${task.completed}-${task.updated_at || task.created_at}`),
    ...upcomingTasksWithRecurring.map(task => `upcoming-${task.id}-${task.title}-${task.completed}-${task.updated_at || task.created_at}`)
  ].join('|')}`;

  return (
    <div className="flex-1">
      {/* Header positioned to align with the add button that's above */}
      <div className="flex items-center justify-center -mt-18 mb-6 h-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-600">
            To Do
          </h1>
        </div>
      </div>

      <TodoBoard />
      <CompletedTasks />
      <IncompleteTasks />
    </div>
  );
}