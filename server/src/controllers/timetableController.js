import supabase from '../supabaseAdmin.js';
import { formatDateString, ensureLocalDate } from '../utils/dateUtils.js';
import { shouldTaskAppearOnDate, applyOverridesToInstances } from './recurringTaskController.js';

// Get all scheduled tasks (is_schedule = true) for a date range
export const getScheduledTasksForDateRange = async (userId, startDate, endDate) => {
  // Get regular scheduled tasks (non-recurring)
  const { data: regularTasks, error: regularError } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .eq('is_schedule', true)
    .eq('is_recurring', false)
    .is('deleted_at', null)
    .not('start_time', 'is', null)
    .not('end_time', 'is', null)
    .gte('start_date', startDate)
    .lte('start_date', endDate)
    .order('start_date', { ascending: true })
    .order('start_time', { ascending: true });

  if (regularError) throw regularError;

  // Get recurring scheduled tasks
  const { data: recurringTasks, error: recurringError } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .eq('is_schedule', true)
    .eq('is_recurring', true)
    .is('deleted_at', null)
    .not('start_time', 'is', null)
    .not('end_time', 'is', null)
    .not('recurring_days', 'is', null);

  if (recurringError) throw recurringError;

  // Generate instances for recurring tasks
  const recurringInstances = [];
  const startDateObj = ensureLocalDate(startDate);
  const endDateObj = ensureLocalDate(endDate);

  for (const task of recurringTasks || []) {
    const currentDate = new Date(startDateObj);

    while (currentDate <= endDateObj) {
      if (shouldTaskAppearOnDate(task, currentDate)) {
        const currentDateString = formatDateString(currentDate);
        recurringInstances.push({
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

  // Apply overrides to recurring instances
  const instancesWithOverrides = await applyOverridesToInstances(userId, recurringInstances);

  // Combine and sort all tasks
  const allTasks = [...(regularTasks || []), ...instancesWithOverrides];

  // Sort by date and time
  allTasks.sort((a, b) => {
    const dateA = a.start_date || a.instance_date;
    const dateB = b.start_date || b.instance_date;

    if (dateA !== dateB) {
      return dateA.localeCompare(dateB);
    }

    const timeA = a.start_time || '00:00';
    const timeB = b.start_time || '00:00';
    return timeA.localeCompare(timeB);
  });

  return allTasks;
};

// Get scheduled tasks for a specific week (Monday to Sunday)
export const getScheduledTasksForWeek = async (userId, weekStartDate) => {
  // Calculate end date (6 days after start)
  const startDateObj = ensureLocalDate(weekStartDate);
  const endDateObj = new Date(startDateObj);
  endDateObj.setDate(startDateObj.getDate() + 6);

  const endDate = formatDateString(endDateObj);

  return getScheduledTasksForDateRange(userId, weekStartDate, endDate);
};