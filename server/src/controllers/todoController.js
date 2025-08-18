import supabase from '../supabaseAdmin.js';
import { ValidationError } from '../utils/errors.js';
import { formatDateString, } from '../utils/dateUtils.js';

const DAYS_OF_WEEK = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

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
  } = todoData; // New task to add as frontend format

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

  // Transform data as backend format
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
  const currentDate = formatDateString(new Date());
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .eq('completed', false)
    .or('completion_count.is.null,completion_count.eq.0')
    .is('deleted_at', null) 
    .or(`start_date.lt.${currentDate},end_date.lt.${currentDate}`)
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

  // Apply date filter if provided
  if (dateRange) {
    query = query.gte('completed_at', dateRange.start)
      .lte('completed_at', dateRange.end);
  }

  const { data, error } = await query.order('completed_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Update function to handle completion tracking
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

  // Check to make sure recurring_days only stores days of week
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

// Hard delete (completely remove from database)
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