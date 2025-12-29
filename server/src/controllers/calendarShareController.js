import supabase from '../supabaseAdmin.js';
import { ValidationError } from '../utils/errors.js';
import crypto from 'crypto';

// Create a calendar share
export const createCalendarShare = async (ownerId, sharedWithEmail, expiresAt = null) => {
  // Find the user by email in Supabase auth.users
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

  if (userError) {
    console.error('Error fetching users:', userError);
    throw new ValidationError('Failed to lookup user');
  }

  const targetUser = users.find(user => user.email === sharedWithEmail);

  if (!targetUser) {
    throw new ValidationError('User not found with that email address');
  }

  if (targetUser.id === ownerId) {
    throw new ValidationError('Cannot share calendar with yourself');
  }

  // Create the share
  const { data, error } = await supabase
    .from('calendar_shares')
    .insert({
      owner_id: ownerId,
      shared_with_user_id: targetUser.id,
      expires_at: expiresAt
    })
    .select(`
      *,
      owner_email:owner_id,
      shared_with_email:shared_with_user_id
    `)
    .single();

  if (error) {
    console.error('Error creating share:', error);
    if (error.code === '23505') { // Unique constraint violation
      throw new ValidationError('Calendar is already shared with this user');
    }
    throw error;
  }

  // Add email information manually since we can't join with auth.users
  const ownerUser = users.find(user => user.id === ownerId);
  const sharedWithUser = users.find(user => user.id === targetUser.id);

  return {
    ...data,
    owner: { email: ownerUser?.email },
    shared_with: { email: sharedWithUser?.email }
  };
};

// Get all shares owned by a user
export const getOwnedShares = async (ownerId) => {
  const { data, error } = await supabase
    .from('calendar_shares')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Get user emails separately
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

  if (userError) {
    console.error('Error fetching users for shares:', userError);
    return data || [];
  }

  // Add email information to each share
  const sharesWithEmails = (data || []).map(share => {
    const sharedWithUser = users.find(user => user.id === share.shared_with_user_id);
    return {
      ...share,
      shared_with: { email: sharedWithUser?.email }
    };
  });

  return sharesWithEmails;
};

// Get all calendars shared with a user
export const getSharedWithMe = async (userId) => {
  const { data, error } = await supabase
    .from('calendar_shares')
    .select('*')
    .eq('shared_with_user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Get user emails separately
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

  if (userError) {
    console.error('Error fetching users for shares:', userError);
    return data || [];
  }

  // Add email information to each share
  const sharesWithEmails = (data || []).map(share => {
    const ownerUser = users.find(user => user.id === share.owner_id);
    return {
      ...share,
      owner: { email: ownerUser?.email }
    };
  });

  return sharesWithEmails;
};

// Get shared calendar tasks for a date range
export const getSharedCalendarTasks = async (shareToken, startDate, endDate) => {
  // Verify share token and get owner
  const { data: share, error: shareError } = await supabase
    .from('calendar_shares')
    .select('owner_id, expires_at, is_active')
    .eq('share_token', shareToken)
    .eq('is_active', true)
    .single();

  if (shareError || !share) {
    throw new ValidationError('Invalid or expired share link');
  }

  // Check if expired
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    throw new ValidationError('Share link has expired');
  }

  // Get scheduled tasks for the date range using existing controller
  const { getScheduledTasksForDateRange } = await import('./timetableController.js');
  return getScheduledTasksForDateRange(share.owner_id, startDate, endDate);
};

// Revoke a calendar share
export const revokeCalendarShare = async (ownerId, shareId) => {
  const { data, error } = await supabase
    .from('calendar_shares')
    .delete()
    .eq('id', shareId)
    .eq('owner_id', ownerId)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new ValidationError('Share not found');

  return data;
};

// ===== E-INK DEVICE FUNCTIONS =====

// Generate device token (similar to share_token generation)
const generateDeviceToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Create e-ink device
export const createEinkDevice = async (ownerId, deviceName) => {
  if (!deviceName || deviceName.trim() === '') {
    throw new ValidationError('Device name is required');
  }

  const deviceToken = generateDeviceToken();

  const { data, error } = await supabase
    .from('eink_devices')
    .insert({
      user_id: ownerId,
      device_name: deviceName.trim(),
      device_token: deviceToken,
      view_type: 'weekly', // Default view type (can be changed via update)
      display_mode: '4gray' // Default display mode (can be changed via update)
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating e-ink device:', error);
    throw error;
  }

  // Return device with token (token shown only once)
  return { ...data, device_token: deviceToken };
};

// Get e-ink device data (for Python - public endpoint)
export const getEinkDeviceData = async (deviceToken, startDate, endDate) => {
  // Verify device token and get owner (same pattern as getSharedCalendarTasks)
  const { data: device, error: deviceError } = await supabase
    .from('eink_devices')
    .select('user_id, view_type, display_mode, is_active')
    .eq('device_token', deviceToken)
    .eq('is_active', true)
    .single();

  if (deviceError || !device) {
    throw new ValidationError('Invalid or inactive device token');
  }

  // Get scheduled tasks for the date range using existing controller
  const { getScheduledTasksForDateRange } = await import('./timetableController.js');
  const tasks = await getScheduledTasksForDateRange(device.user_id, startDate, endDate);

  // Ensure display_mode is always included in config
  const displayMode = device.display_mode || '4gray';
  
  return {
    config: {
      view_type: device.view_type,
      display_mode: displayMode, // Always include display_mode (default: '4gray')
      user_id: device.user_id
    },
    todos: tasks
  };
};

// Get user's e-ink devices (for UI)
export const getEinkDevices = async (ownerId) => {
  const { data, error } = await supabase
    .from('eink_devices')
    .select('*')
    .eq('user_id', ownerId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

// Update e-ink device (for changing view_type and display_mode)
export const updateEinkDevice = async (ownerId, deviceId, updates) => {
  // Validate view_type if provided
  const valid_view_types = ['weekly', 'dual_weekly', 'dual_monthly', 'dual_yearly', 'monthly_square', 'monthly_re'];
  if (updates.view_type && !valid_view_types.includes(updates.view_type)) {
    throw new ValidationError(`Invalid view_type. Must be one of: ${valid_view_types.join(', ')}`);
  }

  // Validate display_mode if provided
  const valid_display_modes = ['4gray', 'bw'];
  if (updates.display_mode && !valid_display_modes.includes(updates.display_mode)) {
    throw new ValidationError(`Invalid display_mode. Must be one of: ${valid_display_modes.join(', ')}`);
  }

  // Build update object with only provided fields
  const updateData = {};
  if (updates.view_type !== undefined) {
    updateData.view_type = updates.view_type;
  }
  if (updates.display_mode !== undefined) {
    updateData.display_mode = updates.display_mode;
  }

  // At least one field must be provided
  if (Object.keys(updateData).length === 0) {
    throw new ValidationError('At least one of view_type or display_mode must be provided');
  }

  const { data, error } = await supabase
    .from('eink_devices')
    .update(updateData)
    .eq('id', deviceId)
    .eq('user_id', ownerId)
    .select()
    .single();

  if (error) {
    console.error('Error updating e-ink device:', error);
    // If it's a column doesn't exist error, provide helpful message
    if (error.message && error.message.includes('column') && error.message.includes('does not exist')) {
      throw new ValidationError(`Database column error: ${error.message}. Please ensure all required columns exist in the database.`);
    }
    throw error;
  }
  if (!data) throw new ValidationError('Device not found');

  return data;
};

// Delete e-ink device
export const deleteEinkDevice = async (ownerId, deviceId) => {
  const { data, error } = await supabase
    .from('eink_devices')
    .delete()
    .eq('id', deviceId)
    .eq('user_id', ownerId)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new ValidationError('Device not found');

  return data;
};
