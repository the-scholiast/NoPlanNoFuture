import supabase from '../supabaseAdmin.js';

const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// Get the day name from a date using UTC
export const getDayNameUTC = (date) => {
  const dayIndex = new Date(date).getUTCDay();
  return DAYS_OF_WEEK[dayIndex];
};

// Check if a task should appear on a specific date
export const shouldTaskAppearOnDate = (task, date) => {
  if (!task.is_recurring || !task.recurring_days || task.recurring_days.length === 0) {
    return false;
  }

  // Convert the input date to UTC noon timestamp for comparison
  const targetDateUTC = new Date(date);
  targetDateUTC.setUTCHours(12, 0, 0, 0);
  const targetTimestamp = targetDateUTC.getTime();

  // Check date range
  if (task.start_date) {
    const taskStartTimestamp = new Date(task.start_date).getTime();
    if (targetTimestamp < taskStartTimestamp) return false;
  }
  
  if (task.end_date) {
    const taskEndTimestamp = new Date(task.end_date).getTime();
    if (targetTimestamp > taskEndTimestamp) return false;
  }

  // Check if day is included
  const dayName = getDayNameUTC(date);
  return task.recurring_days.includes(dayName);
};

// Get tasks for a specific date (including recurring tasks)
export const getTodosForDate = async (userId, date) => {

  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .eq('start_date', date)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Get upcoming recurring task instances for a date range
export const getRecurringTaskInstances = async (userId, startDateUTC, endDateUTC) => {
  // Query database with UTC timestamps for start_date/end_date comparisons
  const { data: recurringTasks, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .eq('is_recurring', true)
    .is('deleted_at', null)
    .not('recurring_days', 'is', null)
    // Use UTC timestamps for database date range filtering
    .or(`start_date.is.null,start_date.lte.${startDateUTC}`)
    .or(`end_date.is.null,end_date.gte.${endDateUTC}`);

  if (error) throw error;

  const instances = [];

  // Extract date portion from UTC timestamps for iteration
  const startDateLocal = startDateUTC.split('T')[0];
  const endDateLocal = endDateUTC.split('T')[0];
  
  const startDateObj = new Date(startDateLocal + 'T00:00:00Z');
  const endDateObj = new Date(endDateLocal + 'T00:00:00Z');

  for (const task of recurringTasks || []) {
    const currentDate = new Date(startDateObj);

    while (currentDate <= endDateObj) {
      if (shouldTaskAppearOnDate(task, currentDate)) {
        // Convert current date to UTC noon timestamp for instance_date
        const instanceDateUTC = new Date(currentDate);
        instanceDateUTC.setUTCHours(12, 0, 0, 0);
        
        instances.push({
          ...task,
          id: `${task.id}_${currentDate.toISOString().split('T')[0]}`,
          instance_date: instanceDateUTC.toISOString(), 
          start_date: instanceDateUTC.toISOString(),  
          parent_task_id: task.id
        });
      }
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }
  }

  return instances;
};