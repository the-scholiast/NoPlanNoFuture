import { TaskData } from "./todoTypes";

export interface Notification {
  id: string;
  user_id: string;
  webhook_url: string;
  cadence: 'daily' | 'weekly';
  day_of_week?: number; // 1-7 (Monday=1, Sunday=7)
  send_time: string; // HH:MM format
  active: boolean;
  period: '1d' | '1w' | '1m';
  include_upcoming: boolean;
  include_recurring: boolean;
  include_daily: boolean;
  last_sent_at?: string;
  last_error?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateNotificationData {
  webhook_url: string;
  cadence: 'daily' | 'weekly';
  day_of_week?: number;
  send_time: string;
  period: '1d' | '1w' | '1m';
  include_upcoming: boolean;
  include_recurring: boolean;
  include_daily: boolean;
}

export interface UpdateNotificationData {
  webhook_url?: string;
  cadence?: 'daily' | 'weekly';
  day_of_week?: number;
  send_time?: string;
  period?: '1d' | '1w' | '1m';
  include_upcoming?: boolean;
  include_recurring?: boolean;
  include_daily?: boolean;
  active?: boolean;
}

export interface NotificationPreview {
  tasks: TaskData[];
  preview: boolean;
}

export interface TestNotificationResult {
  success: boolean;
  message: string;
}

export interface DiscordEmbed {
  title: string;
  color: number;
  fields: DiscordField[];
  footer?: {
    text: string;
  };
}

export interface DiscordField {
  name: string;
  value: string;
  inline: boolean;
}
