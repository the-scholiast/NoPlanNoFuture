import cron from 'node-cron';
import { getActiveNotifications, updateNotificationStatus } from '../controllers/notificationController.js';

// Helper function to check if notification should be sent based on time
const shouldSendNotification = (notification, now) => {
  const { active, cadence, day_of_week, send_time } = notification;
  
  // Only check if notification is active
  if (!active) return false;
  
  // If no send_time is set, don't send
  if (!send_time) return false;
  
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentDayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  
  // Parse send_time (format: "HH:MM")
  const [targetHour, targetMinute] = send_time.split(':').map(Number);
  
  // Check if current time matches send_time (within 5 minutes window)
  const timeDiff = Math.abs((currentHour * 60 + currentMinute) - (targetHour * 60 + targetMinute));
  if (timeDiff > 5) return false;
  
  // Check cadence
  if (cadence === 'daily') {
    return true;
  } else if (cadence === 'weekly' && day_of_week) {
    // Convert day_of_week (1-7) to JavaScript day (0-6)
    const jsDayOfWeek = day_of_week === 7 ? 0 : day_of_week;
    return currentDayOfWeek === jsDayOfWeek;
  }
  
  return false;
};

import { postToDiscord } from '../utils/discordUtils.js';

// Helper function to get tasks for a notification
const getTasksForNotification = async (userId, notification) => {
  const { period, include_upcoming, include_recurring, include_daily } = notification;
  
  // Calculate date range based on period
  const now = new Date();
  let endDate = new Date();
  
  switch (period) {
    case '1d':
      endDate.setDate(now.getDate() + 1);
      break;
    case '1w':
      endDate.setDate(now.getDate() + 7);
      break;
    case '1m':
      endDate.setMonth(now.getMonth() + 1);
      break;
  }

  // Import supabase here to avoid circular dependency
  const { default: supabase } = await import('../supabaseAdmin.js');

  // Build separate queries for each condition and combine results
  let allTasks = [];
  
  const localISOString = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString();
  const endDateLocalISO = new Date(endDate.getTime() - (endDate.getTimezoneOffset() * 60000)).toISOString();
  
  if (include_upcoming) {
    const { data: upcomingTasks, error: upcomingError } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .gte('start_date', localISOString.split('T')[0])
      .lte('start_date', endDateLocalISO.split('T')[0])
      .order('start_date', { ascending: true });
    
    if (upcomingError) throw upcomingError;
    if (upcomingTasks) allTasks.push(...upcomingTasks);
  }
  
  if (include_recurring) {
    const { data: recurringTasks, error: recurringError } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .eq('is_recurring', true)
      .lte('start_date', endDateLocalISO.split('T')[0]) // Only include recurring tasks that start within the period
      .order('start_date', { ascending: true });
    
    if (recurringError) throw recurringError;
    if (recurringTasks) allTasks.push(...recurringTasks);
  }
  
  if (include_daily) {
    const { data: dailyTasks, error: dailyError } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .eq('section', 'daily')
      .order('start_date', { ascending: true });
    
    if (dailyError) throw dailyError;
    if (dailyTasks) allTasks.push(...dailyTasks);
  }

  // Remove duplicates based on task ID
  const uniqueTasks = allTasks.filter((task, index, self) => 
    index === self.findIndex(t => t.id === task.id)
  );

  return uniqueTasks;
};

// Main function to process notifications
const processNotifications = async () => {
  try {
    const now = new Date();
    
    const notifications = await getActiveNotifications();
    
    // Early return if no active notifications
    if (!notifications || notifications.length === 0) {
      return;
    }
    
    console.log(`[${now.toISOString()}] Processing ${notifications.length} active notifications...`);
    
    for (const notification of notifications) {
      try {
        // Debug logging
        console.log(`[${now.toISOString()}] Checking notification ${notification.id}:`);
        console.log(`  - Active: ${notification.active}`);
        console.log(`  - Cadence: ${notification.cadence}`);
        console.log(`  - Day of week: ${notification.day_of_week}`);
        console.log(`  - Send time: ${notification.send_time}`);
        
        if (shouldSendNotification(notification, now)) {
          console.log(`[${now.toISOString()}] Sending notification ${notification.id} to user ${notification.user_id}`);
          
          // Get tasks for this notification
          const tasks = await getTasksForNotification(notification.user_id, notification);
          
          // Send to Discord
          await postToDiscord(notification.webhook_url, tasks);
          
          // Update last_sent_at
          await updateNotificationStatus(notification.id, now.toISOString(), null);
          
          console.log(`[${now.toISOString()}] Successfully sent notification ${notification.id}`);
        } else {
          console.log(`[${now.toISOString()}] Notification ${notification.id} not ready to send`);
        }
      } catch (error) {
        console.error(`[${now.toISOString()}] Error processing notification ${notification.id}:`, error);
        
        // Update last_error
        await updateNotificationStatus(notification.id, null, error.message);
        
        // If Discord returns 401 or 404, mark notification as inactive
        if (error.message.includes('401') || error.message.includes('404')) {
          const { default: supabase } = await import('../supabaseAdmin.js');
          await supabase
            .from('notifications')
            .update({ active: false })
            .eq('id', notification.id);
          console.log(`[${now.toISOString()}] Marked notification ${notification.id} as inactive due to invalid webhook`);
        }
      }
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in notification scheduler:`, error);
  }
};

// Start the cron job - run every minute to check for notifications
export const startNotificationScheduler = () => {
  // Run every minute to check for notifications at specific times
  cron.schedule('* * * * *', processNotifications, {
    scheduled: true,
    timezone: "UTC"
  });
  
  console.log('Notification scheduler started - checking every minute');
};

// Manual trigger for testing
export const triggerNotificationCheck = () => {
  processNotifications();
};

// Manual send function for a specific notification
export const sendNotificationManually = async (notificationId) => {
  try {
    const { default: supabase } = await import('../supabaseAdmin.js');
    
    // Get notification
    const { data: notification, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .eq('id', notificationId)
      .single();

    if (fetchError || !notification) {
      throw new Error('Notification not found');
    }

    if (!notification.active) {
      throw new Error('Notification is not active');
    }

    console.log(`[${new Date().toISOString()}] Manually sending notification ${notificationId} to user ${notification.user_id}`);
    
    // Get tasks for this notification
    const tasks = await getTasksForNotification(notification.user_id, notification);
    
    // Send to Discord
    await postToDiscord(notification.webhook_url, tasks);
    
    // Update last_sent_at
    await updateNotificationStatus(notificationId, new Date().toISOString(), null);
    
    console.log(`[${new Date().toISOString()}] Successfully sent manual notification ${notificationId}`);
    
    return { success: true, message: 'Notification sent successfully' };
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error sending manual notification ${notificationId}:`, error);
    
    // Update last_error
    await updateNotificationStatus(notificationId, null, error.message);
    
    throw error;
  }
};

// Debug function to check notification status
export const debugNotificationStatus = async () => {
  try {
    const notifications = await getActiveNotifications();
    const now = new Date();
    
    console.log('=== Notification Status Debug ===');
    console.log(`Current Time: ${now.toISOString()}`);
    
    for (const notification of notifications) {
      const { active, webhook_url } = notification;
      const shouldSend = shouldSendNotification(notification, now);
      
      console.log(`\nNotification ${notification.id}:`);
      console.log(`  - Active: ${active}`);
      console.log(`  - Webhook URL: ${webhook_url ? 'Set' : 'Not set'}`);
      console.log(`  - Should send now: ${shouldSend}`);
    }
    
    console.log('\n=== End Debug ===');
  } catch (error) {
    console.error('Debug error:', error);
  }
};
