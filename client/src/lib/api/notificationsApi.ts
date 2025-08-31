import { supabase } from '../supabaseClient';
import type { 
  Notification, 
  CreateNotificationData, 
  UpdateNotificationData, 
  NotificationPreview,
  TestNotificationResult 
} from '../../types/notificationTypes';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Helper function to get auth token
const getAuthToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
};

// Get all notifications for the current user
export const getNotifications = async (): Promise<Notification[]> => {
  const token = await getAuthToken();
  if (!token) throw new Error('No authentication token');

  const response = await fetch(`${API_BASE_URL}/notifications`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch notifications');
  }

  return response.json();
};

// Create a new notification
export const createNotification = async (data: CreateNotificationData): Promise<Notification> => {
  const token = await getAuthToken();
  if (!token) throw new Error('No authentication token');

  const response = await fetch(`${API_BASE_URL}/notifications`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create notification');
  }

  return response.json();
};

// Update a notification
export const updateNotification = async (id: string, data: UpdateNotificationData): Promise<Notification> => {
  const token = await getAuthToken();
  if (!token) throw new Error('No authentication token');

  const response = await fetch(`${API_BASE_URL}/notifications/${id}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update notification');
  }

  return response.json();
};

// Delete a notification
export const deleteNotification = async (id: string): Promise<void> => {
  const token = await getAuthToken();
  if (!token) throw new Error('No authentication token');

  const response = await fetch(`${API_BASE_URL}/notifications/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to delete notification');
  }
};

// Test a notification (send immediately)
export const testNotification = async (id: string): Promise<TestNotificationResult> => {
  const token = await getAuthToken();
  if (!token) throw new Error('No authentication token');

  const response = await fetch(`${API_BASE_URL}/notifications/${id}/test`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to test notification');
  }

  return response.json();
};

// Get preview of tasks that would be sent
export const getNotificationPreview = async (data: CreateNotificationData): Promise<NotificationPreview> => {
  const token = await getAuthToken();
  if (!token) throw new Error('No authentication token');

  const response = await fetch(`${API_BASE_URL}/notifications/preview`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to get notification preview');
  }

  return response.json();
};

// Manually send a notification
export const sendNotificationManually = async (id: string): Promise<{ success: boolean; message: string }> => {
  const token = await getAuthToken();
  if (!token) throw new Error('No authentication token');

  const response = await fetch(`${API_BASE_URL}/notifications/${id}/send`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to send notification');
  }

  return response.json();
};
