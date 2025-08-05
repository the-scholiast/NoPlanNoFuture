// server/src/controllers/todoController.js
import { supabase } from '../utils/supabase.js';
import { ValidationError } from '../utils/errors.js';

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
  const { title, section, priority, start_date, end_date, start_time, end_time, description } = todoData;

  if (!title || !section) {
    throw new ValidationError('Title and section are required');
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
    completed_at: null
  };

  // Add new fields if columns exist (graceful degradation)
  try {
    todoToInsert.is_recurring = section === 'daily';
    todoToInsert.completion_count = 0;
    todoToInsert.last_completed_date = null;
    todoToInsert.deleted_at = null;
  } catch (e) {
    // If columns don't exist yet, continue without them
    console.log('New columns not yet available, continuing with basic fields');
  }

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
        // Create timezone-aware date to match frontend behavior
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        updates.completed_at = `${year}-${month}-${day}`;
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
          const year = now.getFullYear();
          const month = String(now.getMonth() + 1).padStart(2, '0');
          const day = String(now.getDate()).padStart(2, '0');
          const today = `${year}-${month}-${day}`;

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
    .update({ deleted_at: new Date().toISOString() })
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
    .lt('deleted_at', cutoffDate.toISOString())
    .select();

  if (error) throw error;
  return data || [];
};

// Soft delete completed tasks from a specific section
export const deleteCompletedTodos = async (userId, section) => {
  const { data, error } = await supabase
    .from('todos')
    .update({ deleted_at: new Date().toISOString() })
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
    .update({ deleted_at: new Date().toISOString() })
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
  const today = new Date().toISOString().split('T')[0];

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
      currentStreak: (lastCompleted === new Date().toISOString().split('T')[0] && task.completed) ? 1 : 0
    };
  });

  return stats;
};