import supabase from '../supabaseAdmin.js';

// Retrieves workout statistics for a user
export const getStats = async (userId) => {
  // Get total workouts count for the user
  const { count: totalWorkouts } = await supabase
    .from('workouts')
    .select('*', { count: 'exact', head: true }) // Count matching rows only, don't return data
    .eq('user_id', userId);
  
  // Get total workout templates count for the user
  const { count: totalTemplates } = await supabase
    .from('workout_templates')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  
  // Calculate date for one week ago to filter recent workouts
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // Get workouts completed in the last 7 days
  const { count: workoutsThisWeek } = await supabase
    .from('workouts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('date', oneWeekAgo.toISOString()); // Filter for dates >= one week ago
  
  // Calculate date for one month ago to filter recent workouts
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  // Get workouts completed in the last month (30 days)
  const { count: workoutsThisMonth } = await supabase
    .from('workouts')
    .select('*', { count: 'exact', head: true }) 
    .eq('user_id', userId)
    .gte('date', oneMonthAgo.toISOString()); // Filter for dates >= one month ago

  // Return statistics object with fallback to 0 for null counts
  return {
    totalWorkouts: totalWorkouts || 0,
    totalTemplates: totalTemplates || 0,
    workoutsThisWeek: workoutsThisWeek || 0,
    workoutsThisMonth: workoutsThisMonth || 0
  };
}