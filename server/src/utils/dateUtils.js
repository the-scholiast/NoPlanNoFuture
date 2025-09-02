import supabase from '../supabaseAdmin.js';

// Get today's date in server's local timezone
export const getTodayString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Convert Date object to YYYY-MM-DD string for database storage
export const formatDateString = (date) => {
  if (!(date instanceof Date)) {
    throw new Error('formatDateString expects a Date object');
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Parse YYYY-MM-DD string to Date object in local timezone
export const parseToLocalDate = (dateString) => {
  if (typeof dateString !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    throw new Error('parseToLocalDate expects a YYYY-MM-DD string');
  }
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
};

// Convert Date or string to Date object, ensuring local timezone
export const ensureLocalDate = (dateInput) => {
  if (dateInput instanceof Date) {
    return dateInput;
  }
  return parseToLocalDate(dateInput);
};

// Validate YYYY-MM-DD date format
export const isValidDateFormat = (dateString) => {
  return typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString);
};

// Get user's today date from their timezone
export const getUserTodayDateString = async (userId) => {
  const { data } = await supabase
    .from('user_profiles')
    .select('timezone')
    .eq('id', userId)
    .single();
  
  const userTimezone = data?.timezone || 'UTC';
  
  const now = new Date();
  return now.toLocaleDateString('en-CA', {
    timeZone: userTimezone
  });
};

// Get user's timezone from database
export const getUserTimezone = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('timezone')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.log('Could not get user timezone, defaulting to UTC');
      return 'UTC';
    }
    
    return data?.timezone || 'UTC';
  } catch (error) {
    console.log('Error getting user timezone:', error);
    return 'UTC';
  }
};