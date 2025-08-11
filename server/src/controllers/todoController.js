import { supabase } from '../utils/supabase.js';
import { ValidationError } from '../utils/errors.js';
import { ensureLocalDate, formatDateString, } from '../utils/dateUtils.js';

// Days of the week mapping
const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// Get the day name from a date
const getDayName = (date) => {
  const dayIndex = new Date(ensureLocalDate(date)).getDay();
  return DAYS_OF_WEEK[dayIndex];
};

// Check if a task should appear on a specific date
const shouldTaskAppearOnDate = (task, date) => {
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

// ===== EXISTING FUNCTIONS (UPDATED FOR SOFT DELETE SUPPORT) =====

// Fetches all active (non-deleted) todos for a specific user
export const getAllTodos = async (userId) => {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null) // Only get non-deleted tasks
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Creates a new todo in the database
export const createTodo = async (userId, todoData) => {
  const {
    title,
    section,
    priority,
    start_date,
    end_date,
    start_time,
    end_time,
    description,
    is_recurring,
    recurring_days,
    is_schedule,
  } = todoData;

  if (!title || !section) {
    throw new ValidationError('Title and section are required');
  }

  // Validate recurring_days if provided
  if (recurring_days && Array.isArray(recurring_days)) {
    const invalidDays = recurring_days.filter(day => !DAYS_OF_WEEK.includes(day.toLowerCase()));
    if (invalidDays.length > 0) {
      throw new ValidationError(`Invalid day names: ${invalidDays.join(', ')}`);
    }
  }

  const todoToInsert = {
    user_id: userId,
    title,
    section,
    priority: priority || null,
    description: description || "",
    start_date: start_date || null,
    end_date: end_date || null,
    start_time: start_time || null,
    end_time: end_time || null,
    completed: false,
    completed_at: null,
    is_recurring: is_recurring || false,
    recurring_days: recurring_days || [],
    completion_count: 0,
    last_completed_date: null,
    deleted_at: null,
    is_schedule: is_schedule || false,
  };

  const { data, error } = await supabase
    .from('todos')
    .insert(todoToInsert)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Get active incompleted tasks
export const getIncompletedTodos = async (userId) => {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .eq('completed', false)
    .is('deleted_at', null) // Exclude deleted tasks
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Get active completed tasks
export const getCompletedTodos = async (userId, dateRange) => {
  let query = supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .eq('completed', true)
    .is('deleted_at', null); // Exclude deleted tasks

  if (dateRange) {
    query = query.gte('completed_at', dateRange.start)
      .lte('completed_at', dateRange.end);
  }

  const { data, error } = await query.order('completed_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Enhanced update function to handle completion tracking
export const updateTodo = async (userId, todoId, updates) => {
  // Handle completion logic
  if ('completed' in updates) {
    if (updates.completed) {
      // Only set completed_at if it's not already provided from frontend
      if (!updates.completed_at) {
        updates.completed_at = updates.completed_at || formatDateString(new Date());
      }

      // If it's a daily task, increment completion count (if column exists)
      try {
        const { data: existingTask } = await supabase
          .from('todos')
          .select('section, completion_count, last_completed_date')
          .eq('id', todoId)
          .eq('user_id', userId)
          .is('deleted_at', null)
          .single();

        if (existingTask && existingTask.section === 'daily') {
          // Use the same timezone-aware date format as frontend
          const now = new Date();
          const today = formatDateString(now);

          // Only increment if not already completed today
          if (existingTask.last_completed_date !== today) {
            updates.completion_count = (existingTask.completion_count || 0) + 1;
            updates.last_completed_date = today;
          }
        }
      } catch (e) {
        // If new columns don't exist, continue without completion tracking
        console.log('Completion tracking columns not available');
      }
    } else {
      updates.completed_at = null;
    }
  }

  if (updates.recurring_days && Array.isArray(updates.recurring_days)) {
    const invalidDays = updates.recurring_days.filter(day => !DAYS_OF_WEEK.includes(day.toLowerCase()));
    if (invalidDays.length > 0) {
      throw new ValidationError(`Invalid day names: ${invalidDays.join(', ')}`);
    }
  }

  // If is_recurring is being set to true, ensure recurring_days is valid
  if (updates.is_recurring && (!updates.recurring_days || updates.recurring_days.length === 0)) {
    throw new ValidationError('Recurring tasks must have at least one day selected');
  }

  const { data, error } = await supabase
    .from('todos')
    .update(updates)
    .eq('id', todoId)
    .eq('user_id', userId)
    .is('deleted_at', null) // Only update non-deleted tasks
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Original delete function (now does hard delete for backward compatibility)
export const deleteTodo = async (userId, todoId) => {
  const { data, error } = await supabase
    .from('todos')
    .delete()
    .eq('id', todoId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return { success: true, deletedTodo: data };
};

// Original bulk delete function (maintains existing signature)
export const bulkDeleteTodos = async (userId, { section, completed, filter }) => {
  let query = supabase
    .from('todos')
    .delete()
    .eq('user_id', userId);

  // Handle both old format and new format
  if (filter) {
    // New format with filter object
    if (filter.section) {
      query = query.eq('section', filter.section);
    }
    if (filter.completed !== undefined) {
      query = query.eq('completed', filter.completed);
    }
  } else {
    // Old format with direct properties
    if (section) {
      query = query.eq('section', section);
    }
    if (completed !== undefined) {
      query = query.eq('completed', completed);
    }
  }

  const { data, error } = await query.select();

  if (error) throw error;
  return { success: true, deleted: data?.length || 0, deletedCount: data?.length || 0 };
};

// ===== NEW SOFT DELETE FUNCTIONS =====

// Soft delete a todo (mark as deleted instead of removing)
export const softDeleteTodo = async (userId, todoId) => {
  const { data, error } = await supabase
    .from('todos')
    .update({ deleted_at: formatDateString(new Date()) })
    .eq('id', todoId)
    .eq('user_id', userId)
    .is('deleted_at', null) // Only delete non-deleted tasks
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Todo not found or already deleted');
  return data;
};

// Restore a soft deleted todo
export const restoreTodo = async (userId, todoId) => {
  const { data, error } = await supabase
    .from('todos')
    .update({ deleted_at: null })
    .eq('id', todoId)
    .eq('user_id', userId)
    .not('deleted_at', 'is', null) // Only restore deleted tasks
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Deleted todo not found');
  return data;
};

// Get deleted todos (for trash/recovery functionality)
export const getDeletedTodos = async (userId, limit = 50) => {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .not('deleted_at', 'is', null) // Only get deleted tasks
    .order('deleted_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
};

// Permanently delete old soft-deleted todos (cleanup function)
export const permanentlyDeleteOldTodos = async (userId, daysOld = 30) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const { data, error } = await supabase
    .from('todos')
    .delete()
    .eq('user_id', userId)
    .not('deleted_at', 'is', null)
    .lt('deleted_at', formatDateString(cutoffDate))
    .select();

  if (error) throw error;
  return data || [];
};

// Soft delete completed tasks from a specific section
export const deleteCompletedTodos = async (userId, section) => {
  const { data, error } = await supabase
    .from('todos')
    .update({ deleted_at: formatDateString(new Date()) })
    .eq('user_id', userId)
    .eq('section', section)
    .eq('completed', true)
    .is('deleted_at', null) // Only delete non-deleted tasks
    .select();

  if (error) throw error;
  return data || [];
};

// Soft delete all tasks from a specific section
export const deleteAllTodos = async (userId, section) => {
  const { data, error } = await supabase
    .from('todos')
    .update({ deleted_at: formatDateString(new Date()) })
    .eq('user_id', userId)
    .eq('section', section)
    .is('deleted_at', null) // Only delete non-deleted tasks
    .select();

  if (error) throw error;
  return data || [];
};

// ===== DAILY TASK FUNCTIONS =====

// Get completed daily tasks (active only)
export const getCompletedDailyTasks = async (userId) => {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .eq('section', 'daily')
    .eq('completed', true)
    .is('deleted_at', null) // Exclude deleted tasks
    .order('completed_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Reset daily tasks for new day (only active tasks)
export const resetDailyTasks = async (userId) => {
  const today = formatDateString(new Date());

  // First, get tasks that need to be reset
  const { data: tasksToReset, error: selectError } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .eq('section', 'daily')
    .eq('completed', true)
    .is('deleted_at', null); // Only reset active tasks

  if (selectError) throw selectError;

  if (!tasksToReset || tasksToReset.length === 0) {
    return []; // No tasks to reset
  }

  // Filter tasks that haven't been completed today (if last_completed_date column exists)
  let tasksToActuallyReset = tasksToReset;
  try {
    tasksToActuallyReset = tasksToReset.filter(task =>
      !task.last_completed_date || task.last_completed_date !== today
    );
  } catch (e) {
    // If last_completed_date column doesn't exist, reset all completed daily tasks
    console.log('last_completed_date column not available, resetting all completed daily tasks');
  }

  if (tasksToActuallyReset.length === 0) {
    return []; // No tasks need to be reset
  }

  // Reset the tasks
  const { data, error } = await supabase
    .from('todos')
    .update({
      completed: false,
      completed_at: null
    })
    .in('id', tasksToActuallyReset.map(task => task.id))
    .select();

  if (error) throw error;
  return data || [];
};

// Get daily task statistics (only active tasks)
export const getDailyTaskStats = async (userId, startDate, endDate) => {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .eq('section', 'daily')
    .is('deleted_at', null) // Exclude deleted tasks
    .order('created_at', { ascending: true });

  if (error) throw error;

  const tasks = data || [];

  // Calculate statistics for each task
  const stats = tasks.map(task => {
    const totalCompletions = task.completion_count || 0;
    const lastCompleted = task.last_completed_date;

    // Calculate completion rate for date range
    let completionRate = 0;
    if (startDate && endDate) {
      const daysDiff = Math.ceil(
        (new Date(endDate).getTime() - new Date(startDate).getTime()) /
        (1000 * 60 * 60 * 24)
      );
      completionRate = daysDiff > 0 ? Math.min(totalCompletions / daysDiff, 1) * 100 : 0;
    } else {
      // Default to last 30 days
      const createdDate = new Date(task.created_at);
      const today = new Date();
      const daysSinceCreated = Math.ceil((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      completionRate = daysSinceCreated > 0 ? Math.min(totalCompletions / daysSinceCreated, 1) * 100 : 0;
    }

    return {
      id: task.id,
      title: task.title,
      totalCompletions,
      lastCompleted,
      completionRate: Math.round(completionRate * 100) / 100, // Round to 2 decimal places
      createdAt: task.created_at,
      currentStreak: (lastCompleted === formatDateString(new Date()) && task.completed) ? 1 : 0
    };
  });

  return stats;
};

// RECURRING TASKS

// Get tasks for a specific date (including recurring tasks)
export const getTodosForDate = async (userId, date) => {
  const dayName = getDayName(date);

  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .or(`and(is_recurring.eq.false,start_date.eq.${date}),and(is_recurring.eq.true,recurring_days.cs.{${dayName}},or(start_date.is.null,start_date.lte.${date}),or(end_date.is.null,end_date.gte.${date}))`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Get upcoming recurring task instances for a date range
export const getRecurringTaskInstances = async (userId, startDate, endDate) => {
  // First, get all recurring tasks
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

// Update the existing getTodayTasks to include recurring tasks
export const getTodayTasks = async (userId) => {
  const today = formatDateString(new Date);
  return getTodosForDate(userId, today);
};

// Get tasks for the upcoming week with recurring instances
export const getUpcomingWeekTasks = async (userId) => {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const nextWeek = new Date(tomorrow);
  nextWeek.setDate(tomorrow.getDate() + 7);

  // Get all recurring tasks that could appear in the upcoming period
  const { data: recurringTasks, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .eq('is_recurring', true)
    .is('deleted_at', null)
    .not('recurring_days', 'is', null);

  if (error) {
    console.error('Error fetching recurring tasks:', error);
    throw error;
  }

  // Filter to only include tasks that will appear in the upcoming period
  const upcomingRecurringTasks = [];

  for (const task of recurringTasks || []) {
    // Check if this recurring task should appear on any day in the upcoming period
    let willAppearInPeriod = false;
    const currentDate = new Date(tomorrow);

    while (currentDate <= nextWeek && !willAppearInPeriod) {
      if (shouldTaskAppearOnDate(task, currentDate)) {
        willAppearInPeriod = true;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (willAppearInPeriod) {
      console.log(`Task ${task.id} (${task.title}) will appear in upcoming period`);
      upcomingRecurringTasks.push(task);
    }
  }

  console.log('Upcoming recurring tasks (originals):', upcomingRecurringTasks.length);
  return upcomingRecurringTasks;
};

// Bulk update recurring days for existing task
export const updateRecurringDays = async (taskId, userId, recurringDays) => {
  if (!Array.isArray(recurringDays)) {
    throw new ValidationError('recurring_days must be an array');
  }

  const invalidDays = recurringDays.filter(day => !DAYS_OF_WEEK.includes(day.toLowerCase()));
  if (invalidDays.length > 0) {
    throw new ValidationError(`Invalid day names: ${invalidDays.join(', ')}`);
  }

  const { data, error } = await supabase
    .from('todos')
    .update({
      recurring_days: recurringDays.map(day => day.toLowerCase()),
      is_recurring: true
    })
    .eq('id', taskId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};