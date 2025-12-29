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

// Get all tasks (scheduled + non-scheduled + daily + today + upcoming) for a date range
// This includes tasks with start_date but without start_time/end_time
export const getAllTasksForDateRange = async (userId, startDate, endDate) => {
  // Get scheduled tasks (with time)
  const scheduledTasks = await getScheduledTasksForDateRange(userId, startDate, endDate);

  // Get non-scheduled tasks (with start_date but no time) - regular tasks
  const { data: regularTasks, error: regularError } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .eq('is_recurring', false)
    .is('deleted_at', null)
    .not('start_date', 'is', null)
    .is('start_time', null) // No start_time
    .is('end_time', null) // No end_time
    .neq('section', 'daily') // Exclude daily tasks (handled separately)
    .neq('section', 'today') // Exclude today tasks (handled separately)
    .neq('section', 'upcoming') // Exclude upcoming tasks (handled separately)
    .gte('start_date', startDate)
    .lte('start_date', endDate)
    .order('start_date', { ascending: true })
    .order('priority', { ascending: false });

  if (regularError) throw regularError;

  // Get non-scheduled recurring tasks
  const { data: recurringTasks, error: recurringError } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .eq('is_recurring', true)
    .is('deleted_at', null)
    .not('start_date', 'is', null)
    .is('start_time', null) // No start_time
    .is('end_time', null) // No end_time
    .neq('section', 'daily') // Exclude daily tasks (handled separately)
    .not('recurring_days', 'is', null);

  if (recurringError) throw recurringError;

  // Get daily tasks (section = 'daily')
  const { data: dailyTasks, error: dailyError } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .eq('section', 'daily')
    .is('deleted_at', null)
    .or(`end_date.is.null,end_date.gte.${startDate}`); // Active daily tasks

  if (dailyError) throw dailyError;

  // Get today tasks (section = 'today') within date range
  const { data: todayTasks, error: todayError } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .eq('section', 'today')
    .is('deleted_at', null);

  if (todayError) throw todayError;

  // Get upcoming tasks (section = 'upcoming') within date range
  const { data: upcomingTasks, error: upcomingError } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .eq('section', 'upcoming')
    .is('deleted_at', null);

  if (upcomingError) throw upcomingError;

  // Generate instances for non-scheduled recurring tasks
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

  // Generate instances for daily tasks (one instance per day in the week)
  const dailyInstances = [];
  for (const task of dailyTasks || []) {
    const currentDate = new Date(startDateObj);
    while (currentDate <= endDateObj) {
      // Check if task is active on this date
      const currentDateString = formatDateString(currentDate);
      const isActive = 
        (!task.start_date || currentDateString >= task.start_date) &&
        (!task.end_date || currentDateString <= task.end_date);

      if (isActive) {
        // For recurring daily tasks, check if they should appear on this day
        if (task.is_recurring && task.recurring_days && task.recurring_days.length > 0) {
          if (shouldTaskAppearOnDate(task, currentDate)) {
            dailyInstances.push({
              ...task,
              id: `${task.id}_${currentDateString}`,
              instance_date: currentDateString,
              start_date: currentDateString,
              parent_task_id: task.id
            });
          }
        } else {
          // Non-recurring daily tasks appear every day
          dailyInstances.push({
            ...task,
            id: `${task.id}_${currentDateString}`,
            instance_date: currentDateString,
            start_date: currentDateString,
            parent_task_id: task.id
          });
        }
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  // Apply overrides to recurring instances
  const instancesWithOverrides = await applyOverridesToInstances(userId, recurringInstances);

  // Filter today and upcoming tasks by date range
  const filteredTodayTasks = (todayTasks || []).filter(task => {
    if (!task.start_date) return true; // Include tasks without start_date
    return task.start_date >= startDate && task.start_date <= endDate;
  });

  const filteredUpcomingTasks = (upcomingTasks || []).filter(task => {
    if (!task.start_date) return false; // Exclude tasks without start_date for upcoming
    return task.start_date >= startDate && task.start_date <= endDate;
  });

  // Combine all tasks
  const allTasks = [
    ...scheduledTasks,
    ...(regularTasks || []),
    ...instancesWithOverrides,
    ...dailyInstances,
    ...filteredTodayTasks,
    ...filteredUpcomingTasks
  ];

  // Sort by date, then by time (if available), then by priority, then by section
  allTasks.sort((a, b) => {
    const dateA = a.start_date || a.instance_date;
    const dateB = b.start_date || b.instance_date;

    if (dateA !== dateB) {
      return dateA.localeCompare(dateB);
    }

    // If both have times, sort by time
    if (a.start_time && b.start_time) {
      return a.start_time.localeCompare(b.start_time);
    }

    // If only one has time, prioritize it
    if (a.start_time && !b.start_time) return -1;
    if (!a.start_time && b.start_time) return 1;

    // If neither has time, sort by section (today > upcoming > daily > others)
    const sectionOrder = { today: 3, upcoming: 2, daily: 1, none: 0 };
    const sectionA = sectionOrder[a.section] || 0;
    const sectionB = sectionOrder[b.section] || 0;
    if (sectionA !== sectionB) {
      return sectionB - sectionA;
    }

    // Then sort by priority
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const priorityA = priorityOrder[a.priority] || 0;
    const priorityB = priorityOrder[b.priority] || 0;
    if (priorityA !== priorityB) {
      return priorityB - priorityA; // Higher priority first
    }

    // Finally, sort by title
    return (a.title || '').localeCompare(b.title || '');
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

