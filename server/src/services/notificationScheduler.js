import cron from 'node-cron';

// Helper function to check if notification should be sent
const shouldSendNotification = (notification, now) => {
  const { cadence, day_of_week, send_time, active } = notification;
  
  if (!active) return false;
  
  // Check if current time matches send_time (HH:MM format)
  const currentTime = now.toTimeString().slice(0, 5); // Get HH:MM
  if (currentTime !== send_time) return false;
  
  // For daily cadence, always send
  if (cadence === 'daily') return true;
  
  // For weekly cadence, check day of week
  if (cadence === 'weekly') {
    // Convert JavaScript day (0=Sunday) to our format (1=Monday, 7=Sunday)
    const currentDay = now.getDay();
    const adjustedDay = currentDay === 0 ? 7 : currentDay; // Sunday becomes 7
    return adjustedDay === day_of_week;
  }
  
  return false;
};

// Helper function to post to Discord (extracted from controller for reuse)
const postToDiscord = async (webhookUrl, tasks) => {
  // Group tasks by type
  const upcoming = tasks.filter(t => t.due_at && !t.is_recurring && !t.is_daily);
  const recurring = tasks.filter(t => t.is_recurring);
  const daily = tasks.filter(t => t.is_daily);

  const embeds = [];

  // Upcoming tasks embed
  if (upcoming.length > 0) {
    embeds.push({
      title: '📅 Upcoming Tasks',
      color: 0x3498db,
      fields: upcoming.slice(0, 25).map(task => ({
        name: task.title,
        value: `${task.due_at ? new Date(task.due_at).toLocaleDateString() : 'No due date'}${task.priority ? ` · ${task.priority}` : ''}`,
        inline: false
      })),
      footer: upcoming.length > 25 ? { text: `+${upcoming.length - 25} more tasks` } : undefined
    });
  }

  // Recurring tasks embed
  if (recurring.length > 0) {
    embeds.push({
      title: '🔄 Recurring Tasks',
      color: 0xe74c3c,
      fields: recurring.slice(0, 25).map(task => ({
        name: task.title,
        value: `${task.recurring_days ? task.recurring_days.join(', ') : 'No schedule'}${task.priority ? ` · ${task.priority}` : ''}`,
        inline: false
      })),
      footer: recurring.length > 25 ? { text: `+${recurring.length - 25} more tasks` } : undefined
    });
  }

  // Daily tasks embed
  if (daily.length > 0) {
    embeds.push({
      title: '📝 Daily Tasks',
      color: 0x2ecc71,
      fields: daily.slice(0, 25).map(task => ({
        name: task.title,
        value: `${task.priority ? `Priority: ${task.priority}` : 'No priority'}`,
        inline: false
      })),
      footer: daily.length > 25 ? { text: `+${daily.length - 25} more tasks` } : undefined
    });
  }

  if (embeds.length === 0) {
    embeds.push({
      title: '📅 No Tasks Found',
      description: 'No tasks match your notification criteria.',
      color: 0x95a5a6
    });
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      content: '📅 **Your Upcoming Tasks**',
      embeds
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Discord webhook failed: ${response.status} ${errorText}`);
  }

  return response;
};

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

  let query = supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null);

  // Build conditions based on what to include
  const conditions = [];
  
  if (include_upcoming) {
    conditions.push(`(due_at >= '${now.toISOString()}' AND due_at <= '${endDate.toISOString()}')`);
  }
  
  if (include_recurring) {
    conditions.push('is_recurring = true');
  }
  
  if (include_daily) {
    conditions.push('is_daily = true');
  }

  if (conditions.length > 0) {
    query = query.or(conditions.join(','));
  }

  const { data, error } = await query.order('due_at', { ascending: true });

  if (error) throw error;
  return data || [];
};

// Main function to process notifications
const processNotifications = async () => {
  try {
    console.log(`[${new Date().toISOString()}] Processing notifications...`);
    
    const notifications = await getActiveNotifications();
    const now = new Date();
    
    for (const notification of notifications) {
      try {
        if (shouldSendNotification(notification, now)) {
          console.log(`[${new Date().toISOString()}] Sending notification ${notification.id} to user ${notification.user_id}`);
          
          // Get tasks for this notification
          const tasks = await getTasksForNotification(notification.user_id, notification);
          
          // Send to Discord
          await postToDiscord(notification.webhook_url, tasks);
          
          // Update last_sent_at
          await updateNotificationStatus(notification.id, now.toISOString(), null);
          
          console.log(`[${new Date().toISOString()}] Successfully sent notification ${notification.id}`);
        }
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error processing notification ${notification.id}:`, error);
        
        // Update last_error
        await updateNotificationStatus(notification.id, null, error.message);
        
        // If Discord returns 401 or 404, mark notification as inactive
        if (error.message.includes('401') || error.message.includes('404')) {
          const { default: supabase } = await import('../supabaseAdmin.js');
          await supabase
            .from('notifications')
            .update({ active: false })
            .eq('id', notification.id);
          console.log(`[${new Date().toISOString()}] Marked notification ${notification.id} as inactive due to invalid webhook`);
        }
      }
    }
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in notification scheduler:`, error);
  }
};

// Start the cron job
export const startNotificationScheduler = () => {
  // Run every minute to check for notifications
  // This allows us to catch notifications at :00 and :30
  cron.schedule('* * * * *', processNotifications, {
    scheduled: true,
    timezone: "UTC" // Use UTC to avoid timezone issues
  });
  
  console.log('Notification scheduler started - checking every minute');
};

// Manual trigger for testing
export const triggerNotificationCheck = () => {
  processNotifications();
};
