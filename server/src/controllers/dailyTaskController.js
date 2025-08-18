import supabase from '../supabaseAdmin.js';
import { formatDateString, } from '../utils/dateUtils.js';

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

  // Build the query step by step for clarity
  let query = supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .eq('section', 'daily')
    .eq('completed', true)
    .is('deleted_at', null);

  // Add end_date filter: either no end_date OR end_date >= today (task hasn't ended)
  query = query.or(`end_date.is.null,end_date.gte.${today}`);

  // Add last_completed_date filter: either no last_completed_date OR last_completed_date != today
  query = query.or(`last_completed_date.is.null,last_completed_date.neq.${today}`);

  const { data: tasksToReset, error: selectError } = await query;

  if (selectError) {
    console.error('Query error:', selectError);
    throw selectError;
  }

  if (!tasksToReset || tasksToReset.length === 0) {
    console.log('ℹNo tasks need resetting');
    return [];
  }

  // Reset the tasks
  const { data, error } = await supabase
    .from('todos')
    .update({
      completed: false,
      completed_at: null
    })
    .in('id', tasksToReset.map(task => task.id))
    .select();

  if (error) {
    console.error('Update error:', error);
    throw error;
  }

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