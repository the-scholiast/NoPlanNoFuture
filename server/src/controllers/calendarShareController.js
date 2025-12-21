import supabase from '../supabaseAdmin.js';
import { ValidationError } from '../utils/errors.js';

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
  // Handle both user shares (with shared_with_user_id) and public tokens (NULL)
  const sharesWithEmails = (data || []).map(share => {
    // If shared_with_user_id is NULL, it's a public token
    if (!share.shared_with_user_id) {
      return {
        ...share,
        shared_with: null,
        is_public: true
      };
    }
    
    const sharedWithUser = users.find(user => user.id === share.shared_with_user_id);
    return {
      ...share,
      shared_with: { email: sharedWithUser?.email },
      is_public: false
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

// Create a public calendar token (for devices like Raspberry Pi)
// This doesn't require an email - shared_with_user_id will be NULL
export const createPublicCalendarToken = async (ownerId, expiresAt = null) => {
  // Create the share with NULL shared_with_user_id for public access
  const { data, error } = await supabase
    .from('calendar_shares')
    .insert({
      owner_id: ownerId,
      shared_with_user_id: null, // NULL means it's a public token
      expires_at: expiresAt
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating public token:', error);
    throw error;
  }

  // Get owner email for response
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
  const ownerUser = !userError ? users.find(user => user.id === ownerId) : null;

  return {
    ...data,
    owner: { email: ownerUser?.email },
    shared_with: null // Public token, no specific user
  };
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