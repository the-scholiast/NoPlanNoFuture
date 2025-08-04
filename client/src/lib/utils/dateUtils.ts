export const isToday = (dateString?: string): boolean => {
  if (!dateString) return false;
  const today = new Date();
  const taskDate = new Date(dateString);

  return (
    taskDate.getFullYear() === today.getFullYear() &&
    taskDate.getMonth() === today.getMonth() &&
    taskDate.getDate() === today.getDate()
  );
};

export const isUpcoming = (dateString?: string): boolean => {
  if (!dateString) return false;
  const today = new Date();
  const taskDate = new Date(dateString);

  // Set time to start of day for accurate comparison
  today.setHours(0, 0, 0, 0);
  taskDate.setHours(0, 0, 0, 0);

  return taskDate > today;
};

export const isPast = (dateString?: string): boolean => {
  if (!dateString) return false;
  const today = new Date();
  const taskDate = new Date(dateString);

  // Set time to start of day for accurate comparison
  today.setHours(0, 0, 0, 0);
  taskDate.setHours(0, 0, 0, 0);

  return taskDate < today;
};

// Helper function to check if a task should be excluded from date-based sections
export const isDailyTask = (task: { section?: string }): boolean => {
  return task.section === 'daily';
};