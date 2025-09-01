// Get today's date in local timezone to avoid UTC offset issues
export const getTodayString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Parse string (yyyy-mm-dd) to Date object in local timezone
export const parseToLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
};

// Convert Date or string to Date object, ensuring local timezone
export const ensureLocalDate = (date: Date | string): Date => {
  return date instanceof Date ? date : parseToLocalDate(date);
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

// UTC noon conversion for local timezone for start_date and end_date
export const localDateToUTC = (dateString: string): string => {
  const [year, month, day] = dateString.split('-').map(Number);
  const utcDate = new Date();
  utcDate.setUTCFullYear(year, month - 1, day);
  utcDate.setUTCHours(12, 0, 0, 0); // UTC noon
  return utcDate.toISOString();
}

// Get today's noon UTC date
export const todayNoonUTC = (): Date => {
  const todayNoon = new Date();
  todayNoon.setUTCHours(12, 0, 0, 0);
  return todayNoon;
}