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

