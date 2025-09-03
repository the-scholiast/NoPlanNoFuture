import supabase from '../supabaseAdmin.js';
import { ValidationError } from '../utils/errors.js';
import { getUserDateString } from '../utils/dateUtils.js';

// Validation functions
const validateWebhookUrl = (url) => {
  const webhookPattern = /^https:\/\/discord\.com\/api\/webhooks\/[^\/]+\/[^\/]+$/;
  if (!webhookPattern.test(url)) {
    throw new ValidationError('Invalid Discord webhook URL format');
  }
};

const validateSendTime = (time) => {
  if (!time) {
    throw new ValidationError('Send time is required');
  }
  
  // Validate time format (HH:MM)
  const timePattern = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timePattern.test(time)) {
    throw new ValidationError('Send time must be in HH:MM format (e.g., "09:30")');
  }
  
  return true;
};

const validateCadence = (cadence) => {
  if (!['daily', 'weekly'].includes(cadence)) {
    throw new ValidationError('Cadence must be either "daily" or "weekly"');
  }
};

const validateDayOfWeek = (dayOfWeek) => {
  if (dayOfWeek && (dayOfWeek < 1 || dayOfWeek > 7)) {
    throw new ValidationError('Day of week must be between 1 (Monday) and 7 (Sunday)');
  }
};

const validatePeriod = (period) => {
  if (!['1d', '1w', '1m'].includes(period)) {
    throw new ValidationError('Period must be "1d", "1w", or "1m"');
  }
};

// Get all notifications for a user
export const getNotifications = async (userId) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Create a new notification
export const createNotification = async (userId, notificationData) => {
  const {
    webhook_url,
    cadence = 'weekly',
    day_of_week,
    send_time,
    period = '1w',
    include_upcoming = true,
    include_recurring = true,
    include_daily = true
  } = notificationData;

  // Validate required fields
  if (!webhook_url) {
    throw new ValidationError('Webhook URL is required');
  }

  // Validate fields
  validateWebhookUrl(webhook_url);
  validateCadence(cadence);
  validatePeriod(period);

  // Validate day_of_week for weekly cadence
  if (cadence === 'weekly' && !day_of_week) {
    throw new ValidationError('Day of week is required for weekly cadence');
  }
  if (day_of_week) {
    validateDayOfWeek(day_of_week);
  }

  const notificationToInsert = {
    user_id: userId,
    webhook_url,
    cadence,
    day_of_week: cadence === 'weekly' ? day_of_week : null,
    send_time,
    period,
    include_upcoming,
    include_recurring,
    include_daily,
    active: true
  };

  const { data, error } = await supabase
    .from('notifications')
    .insert(notificationToInsert)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update a notification
export const updateNotification = async (userId, notificationId, updates) => {
  // First check if notification exists and belongs to user
  const { data: existing, error: fetchError } = await supabase
    .from('notifications')
    .select('*')
    .eq('id', notificationId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !existing) {
    throw new ValidationError('Notification not found');
  }

  // Validate fields if provided
  if (updates.webhook_url) {
    validateWebhookUrl(updates.webhook_url);
  }
  if (updates.send_time) {
    validateSendTime(updates.send_time);
  }
  if (updates.cadence) {
    validateCadence(updates.cadence);
  }
  if (updates.day_of_week) {
    validateDayOfWeek(updates.day_of_week);
  }
  if (updates.period) {
    validatePeriod(updates.period);
  }

  // Handle day_of_week logic
  if (updates.cadence === 'daily') {
    updates.day_of_week = null;
  } else if (updates.cadence === 'weekly' && !updates.day_of_week) {
    throw new ValidationError('Day of week is required for weekly cadence');
  }

  const { data, error } = await supabase
    .from('notifications')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', notificationId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete a notification
export const deleteNotification = async (userId, notificationId) => {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)
    .eq('user_id', userId);

  if (error) throw error;
  return { success: true };
};

// Test a notification (send immediately)
export const testNotification = async (userId, notificationId) => {
  // Get notification
  const { data: notification, error: fetchError } = await supabase
    .from('notifications')
    .select('*')
    .eq('id', notificationId)
    .eq('user_id', userId)
    .single();

  if (fetchError || !notification) {
    throw new ValidationError('Notification not found');
  }

  try {
    // Get tasks for preview
    const tasks = await getTasksForNotification(userId, notification);
    
    // Send to Discord
    await postToDiscord(notification.webhook_url, tasks);
    
    // Update last_sent_at
    await supabase
      .from('notifications')
      .update({ 
        last_sent_at: new Date().toISOString(),
        last_error: null 
      })
      .eq('id', notificationId);

    return { success: true, message: 'Test notification sent successfully' };
  } catch (error) {
    // Update last_error
    await supabase
      .from('notifications')
      .update({ last_error: error.message })
      .eq('id', notificationId);

    throw error;
  }
};

// Get preview of tasks that would be sent
export const getNotificationPreview = async (userId, notificationData) => {
  try {
    const tasks = await getTasksForNotification(userId, notificationData);
    return { tasks, preview: true };
  } catch (error) {
    throw error;
  }
};

// Helper function to get tasks for a notification
const getTasksForNotification = async (userId, notification) => {
  const { period, include_upcoming, include_recurring, include_daily } = notification;
  
  // Calculate date range based on period using local time
  const now = new Date();
  const localISOString = getUserDateString(userId, new Date());
  
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
  const endDateLocalISO = getUserDateString(userId, endDate);

  // Build separate queries for each condition and combine results
  let allTasks = [];
  
  if (include_upcoming) {
    const { data: upcomingTasks, error: upcomingError } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .gte('start_date', localISOString)
      .lte('start_date', endDateLocalISO)
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

import { postToDiscord } from '../utils/discordUtils.js';

// Get all active notifications (for cron job)
export const getActiveNotifications = async () => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('active', true);

  if (error) throw error;
  return data || [];
};

// Update notification last_sent_at and last_error
export const updateNotificationStatus = async (notificationId, lastSentAt, lastError = null) => {
  const { error } = await supabase
    .from('notifications')
    .update({
      last_sent_at: lastSentAt,
      last_error: lastError,
      updated_at: new Date().toISOString()
    })
    .eq('id', notificationId);

  if (error) throw error;
  return { success: true };
};
