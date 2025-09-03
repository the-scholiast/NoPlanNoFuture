import supabase from '../supabaseAdmin.js';
import { getUserDateString } from '../utils/dateUtils.js';

// Reset daily tasks for new day (only active tasks)
export const resetDailyTasks = async (userId) => {
  const today = await getUserDateString(userId, new Date());

  const { data: tasksToReset, error: selectError } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .eq('section', 'daily')
    .eq('completed', true)
    .is('deleted_at', null)
    .or(`end_date.is.null,end_date.gte.${today}`)
    .not('last_completed_date', 'eq', today);

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