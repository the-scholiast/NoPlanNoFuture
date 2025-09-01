import supabase from '../supabaseAdmin.js';

// Reset daily tasks for new day (only active tasks)
export const resetDailyTasks = async (userId, userTimezone) => {
  const now = new Date();
  const today = now.toLocaleString("en-CA", { timeZone: userTimezone }).split(",")[0];

  // Check if we've already reset today
  const { data: user } = await supabase
    .from('user_profiles')
    .select('last_daily_reset')
    .eq('id', userId)
    .single();

  // If already reset today, do nothing
  if (user.last_daily_reset === today) {
    console.log('Daily tasks already reset today');
    return [];
  }

  const todayNoon = new Date();
  todayNoon.setUTCHours(12, 0, 0, 0);

  let query = supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .eq('section', 'daily')
    .eq('completed', true)
    .is('deleted_at', null);

  query = query.or(`end_date.is.null,end_date.gte.${todayNoon.toISOString()}`);
  query = query.or(
    `last_completed_date.is.null,` +
    `last_completed_date.lt.${new Date().toISOString()}`
  );

  const { data: tasksToReset } = await query;

  if (tasksToReset?.length > 0) {
    // Reset the tasks
    await supabase
      .from('todos')
      .update({ completed: false, completed_at: null })
      .in('id', tasksToReset.map(task => task.id));
  }

  // Mark that we've reset today
  await supabase
    .from('user_profiles')
    .update({ last_daily_reset: today })
    .eq('id', userId);

  return tasksToReset || [];
};