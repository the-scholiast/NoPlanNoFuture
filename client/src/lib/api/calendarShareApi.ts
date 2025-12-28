import { apiCall } from "./client";

export interface CalendarShare {
  id: string;
  owner_id: string;
  shared_with_user_id: string;
  share_token: string;
  permissions: string;
  created_at: string;
  expires_at: string | null;
  is_active: boolean;
  owner?: { email: string };
  shared_with?: { email: string };
}

export const createCalendarShare = async (email: string, expiresAt?: string): Promise<CalendarShare> => {
  return apiCall(`/calendar-shares`, {
    method: 'POST',
    body: JSON.stringify({ email, expiresAt }),
  })
};

export const getOwnedShares = async (): Promise<CalendarShare[]> => {
  return apiCall(`/calendar-shares/owned`)
};

export const getSharedWithMe = async (): Promise<CalendarShare[]> => {
  return apiCall(`/calendar-shares/shared-with-me`)
};

export const getSharedCalendarTasks = async (shareToken: string, startDate: string, endDate: string) => {
  return apiCall(`/calendar-shares/view/${shareToken}?startDate=${startDate}&endDate=${endDate}`)
};

export const revokeCalendarShare = async (shareId: string): Promise<CalendarShare> => {
  return apiCall(`/calendar-shares/${shareId}`, {
    method: 'DELETE'
  })
};

// ===== E-INK DEVICE TYPES AND FUNCTIONS =====

export interface EinkDevice {
  id: string;
  user_id: string;
  device_name: string;
  device_token: string;
  view_type: 'weekly' | 'dual_weekly' | 'dual_monthly' | 'dual_yearly' | 'monthly_square' | 'monthly_re';
  last_synced_at: string | null;
  created_at: string;
  is_active: boolean;
  update_pending?: boolean;
  update_requested_at?: string | null;
}

export const createEinkDevice = async (deviceName: string): Promise<EinkDevice> => {
  return apiCall(`/calendar-shares/devices`, {
    method: 'POST',
    body: JSON.stringify({ deviceName }),
  });
};

export const getEinkDevices = async (): Promise<EinkDevice[]> => {
  return apiCall(`/calendar-shares/devices`);
};

export const updateEinkDevice = async (deviceId: string, updates: Partial<EinkDevice>): Promise<EinkDevice> => {
  return apiCall(`/calendar-shares/devices/${deviceId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
};

export const deleteEinkDevice = async (deviceId: string): Promise<EinkDevice> => {
  return apiCall(`/calendar-shares/devices/${deviceId}`, {
    method: 'DELETE',
  });
};

export const getEinkDeviceData = async (deviceToken: string, startDate: string, endDate: string) => {
  return apiCall(`/calendar-shares/devices/view/${deviceToken}?startDate=${startDate}&endDate=${endDate}`);
};

