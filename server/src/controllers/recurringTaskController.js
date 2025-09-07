import supabase from '../supabaseAdmin.js';
import { formatDateString, ensureLocalDate } from '../utils/dateUtils.js';
import { ValidationError } from '../utils/errors.js';

const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// Get the day name from a date
export const getDayName = (date) => {
  const dayIndex = new Date(ensureLocalDate(date)).getDay();
  return DAYS_OF_WEEK[dayIndex];
};

// Check if a task should appear on a specific date
export const shouldTaskAppearOnDate = (task, date) => {
  if (!task.is_recurring || !task.recurring_days || task.recurring_days.length === 0) {
    return false;
  }

  // Check date range
  if (task.start_date && formatDateString(date) < task.start_date) return false;
  if (task.end_date && formatDateString(date) > task.end_date) return false;

  // Check if day is included
  const dayName = getDayName(date);
  return task.recurring_days.includes(dayName);
};

// Get tasks for a specific date 
export const getTodosForDate = async (userId, date) => {

  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .neq('section', 'daily')
    .neq('section', 'none')
    .eq('is_recurring', false)
    .is('deleted_at', null)
    .eq('start_date', date)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Get upcoming recurring task instances for a date range
export const getRecurringTaskInstances = async (userId, startDate, endDate) => {
  // Get all recurring tasks
  const { data: recurringTasks, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .eq('is_recurring', true)
    .is('deleted_at', null)
    .not('recurring_days', 'is', null);

  if (error) throw error;

  const instances = [];

  // Convert to Date objects for iteration, avoiding UTC issues
  const startDateObj = ensureLocalDate(startDate);
  const endDateObj = ensureLocalDate(endDate);

  for (const task of recurringTasks || []) {
    // Create a new Date object to avoid mutating the original
    const currentDate = new Date(startDateObj);

    while (currentDate <= endDateObj) {
      // shouldTaskAppearOnDate expects a Date object, not a string
      if (shouldTaskAppearOnDate(task, currentDate)) {
        const currentDateString = formatDateString(currentDate);
        instances.push({
          ...task,
          id: `${task.id}_${currentDateString}`,
          instance_date: currentDateString,
          start_date: currentDateString,
          parent_task_id: task.id
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  return instances;
};

// Create or update a task override for a specific instance
export const createOrUpdateTaskOverride = async (userId, parentTaskId, instanceDate, overrideData) => {
  // Validate that the parent task exists and belongs to the user
  const { data: parentTask, error: parentError } = await supabase
    .from('todos')
    .select('id, is_recurring')
    .eq('id', parentTaskId)
    .eq('user_id', userId)
    .single();

  if (parentError || !parentTask) {
    throw new ValidationError('Parent task not found');
  }

  if (!parentTask.is_recurring) {
    throw new ValidationError('Cannot create override for non-recurring task');
  }

  // Prepare override data (only store non-null values)
  const cleanOverrideData = {};
  Object.keys(overrideData).forEach(key => {
    if (overrideData[key] !== null && overrideData[key] !== undefined && overrideData[key] !== '') {
      cleanOverrideData[key] = overrideData[key];
    }
  });

  // Upsert the override
  const { data, error } = await supabase
    .from('task_overrides')
    .upsert({
      user_id: userId,
      parent_task_id: parentTaskId,
      instance_date: instanceDate,
      ...cleanOverrideData,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'parent_task_id,instance_date'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Get override for a specific task instance
export const getTaskOverride = async (userId, parentTaskId, instanceData) => {
  const {data, error} = await supabase
    .from('task_overrides')
    .select('*')
    .eq('user_id', userId)
    .eq('parent_task_id', parentTaskId)
    .eq('instance_date', instanceData)
    .maybeSingle();

  if (error) throw error;
  return data;
}

