export const isToday = (dateString?: string): boolean => {
  if (!dateString) return false;
  
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
  const taskDateStr = dateString.split('T')[0]; // Remove time if present
  
  return todayStr === taskDateStr;
};

export const isUpcoming = (dateString?: string): boolean => {
  if (!dateString) return false;
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const taskDate = dateString.split('T')[0];

  return taskDate > todayStr;
};

export const isPast = (dateString?: string): boolean => {
  if (!dateString) return false;
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const taskDateStr = dateString.split('T')[0];

  return taskDateStr < todayStr;
};

// Helper function to check if a task should be excluded from date-based sections
export const isDailyTask = (task: { section?: string }): boolean => {
  return task.section === 'daily';
};