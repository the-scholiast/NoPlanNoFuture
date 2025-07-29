// Change to camel case for frontend
export const transformTodoFromDB = (todo) => ({
  id: todo.id,
  title: todo.title,
  completed: todo.completed,
  createdAt: new Date(todo.created_at),
  section: todo.section,
  priority: todo.priority,
  startDate: todo.start_date,
  endDate: todo.end_date,
  startTime: todo.start_time,
  endTime: todo.end_time
});

// Change to snake case for backend
export const transformTodoToDB = (todo) => {
  const dbTodo = {};
  if (todo.user_id !== undefined) dbTodo.user_id = todo.user_id;
  if (todo.title !== undefined) dbTodo.title = todo.title;
  if (todo.completed !== undefined) dbTodo.completed = todo.completed;
  if (todo.section !== undefined) dbTodo.section = todo.section;
  if (todo.priority !== undefined) dbTodo.priority = todo.priority;
  if (todo.startDate !== undefined) dbTodo.start_date = todo.startDate;
  if (todo.endDate !== undefined) dbTodo.end_date = todo.endDate;
  if (todo.startTime !== undefined) dbTodo.start_time = todo.startTime;
  if (todo.endTime !== undefined) dbTodo.end_time = todo.endTime;
  return dbTodo;
};