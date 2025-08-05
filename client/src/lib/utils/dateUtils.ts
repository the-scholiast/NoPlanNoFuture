// Get today's date in local timezone to avoid UTC offset issues
const getTodayString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const isToday = (dateString?: string): boolean => {
  if (!dateString) return false;
  
  const todayStr = getTodayString(); // Get today in local timezone
  const taskDateStr = dateString.split('T')[0]; // Remove time if present
  
  return todayStr === taskDateStr;
};

export const isUpcoming = (dateString?: string): boolean => {
  if (!dateString) return false;
  
  const todayStr = getTodayString(); // Get today in local timezone
  const taskDate = dateString.split('T')[0];

  return taskDate > todayStr;
};

export const isPast = (dateString?: string): boolean => {
  if (!dateString) return false;
  
  const todayStr = getTodayString(); // Get today in local timezone
  const taskDateStr = dateString.split('T')[0];

  return taskDateStr < todayStr;
};

// Helper function to check if a task should be excluded from date-based sections
export const isDailyTask = (task: { section?: string }): boolean => {
  return task.section === 'daily';
};