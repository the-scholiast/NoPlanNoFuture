import supabase from '../supabaseAdmin.js';
import { getUserTodayDateString} from '../utils/dateUtils.js';

// Reset daily tasks for new day (only active tasks)
export const resetDailyTasks = async (userId) => {
  const today = getUserTodayDateString();

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