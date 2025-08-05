// client/src/lib/api/todos.ts
import { TaskData, CreateTaskData } from '@/types/todoTypes';
import { supabase } from '@/lib/supabaseClient';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Helper function to get auth headers
const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('No authentication token available');
  }

  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  };
};

// Enhanced API request function with authentication
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}/api/todos${endpoint}`;
  
  try {
    const headers = await getAuthHeaders();
    
    const config: RequestInit = {
      headers,
      ...options,
    };

    console.log(`Making API request to: ${url}`);
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

export const todoApi = {
  // Fetch all todos from the API
  getAll: async (): Promise<TaskData[]> => {
    return apiRequest<TaskData[]>('/all');
  },

  // Fetch incomplete todos
  getIncomplete: async (): Promise<TaskData[]> => {
    return apiRequest<TaskData[]>('/incomplete');
  },

  // Fetch completed todos
  getCompleted: async (): Promise<TaskData[]> => {
    return apiRequest<TaskData[]>('/complete');
  },

  // Get a single todo by ID
  get: async (id: string): Promise<TaskData> => {
    return apiRequest<TaskData>(`/${id}`);
  },

  // Create a new todo
  create: async (todoData: CreateTaskData): Promise<TaskData> => {
    return apiRequest<TaskData>('/', {
      method: 'POST',
      body: JSON.stringify(todoData),
    });
  },

  // Update a todo
  update: async (id: string, updates: Partial<TaskData>): Promise<TaskData> => {
    return apiRequest<TaskData>(`/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  // Delete a todo (hard delete for backward compatibility)
  delete: async (id: string): Promise<{ success: boolean }> => {
    return apiRequest<{ success: boolean }>(`/${id}`, {
      method: 'DELETE',
    });
  },

  // Bulk delete todos
  bulkDelete: async (criteria: any): Promise<{ success: boolean; deletedCount: number }> => {
    return apiRequest<{ success: boolean; deletedCount: number }>('/bulk-delete', {
      method: 'POST',
      body: JSON.stringify(criteria),
    });
  },

  // Helper methods for specific bulk operations
  deleteCompleted: async (section: 'daily' | 'today' | 'upcoming'): Promise<{ success: boolean; deletedCount: number }> => {
    return apiRequest<{ success: boolean; deletedCount: number }>('/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ 
        filter: { 
          completed: true, 
          section 
        } 
      }),
    });
  },

  deleteAll: async (section: 'daily' | 'today' | 'upcoming'): Promise<{ success: boolean; deletedCount: number }> => {
    return apiRequest<{ success: boolean; deletedCount: number }>('/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ 
        filter: { 
          section 
        } 
      }),
    });
  },

  // ===== NEW SOFT DELETE METHODS =====

  // Soft delete a todo
  softDelete: async (id: string): Promise<TaskData> => {
    return apiRequest<TaskData>(`/${id}/soft-delete`, {
      method: 'DELETE',
    });
  },

  // Restore a soft deleted todo
  restore: async (id: string): Promise<TaskData> => {
    return apiRequest<TaskData>(`/${id}/restore`, {
      method: 'PATCH',
    });
  },

  // Get deleted todos (trash)
  getDeleted: async (limit = 50): Promise<TaskData[]> => {
    return apiRequest<TaskData[]>(`/deleted?limit=${limit}`);
  },

  // Permanently delete a todo
  permanentDelete: async (id: string): Promise<void> => {
    return apiRequest<void>(`/${id}/permanent`, {
      method: 'DELETE',
    });
  },

  // Cleanup old deleted todos
  cleanupOldDeleted: async (daysOld = 30): Promise<TaskData[]> => {
    return apiRequest<TaskData[]>(`/cleanup/old?days=${daysOld}`, {
      method: 'DELETE',
    });
  },

  // ===== DAILY TASK METHODS =====

  // Get completed daily tasks
  getCompletedDailyTasks: async (): Promise<TaskData[]> => {
    return apiRequest<TaskData[]>('/daily/completed');
  },

  // Reset daily tasks
  resetDailyTasks: async (): Promise<TaskData[]> => {
    return apiRequest<TaskData[]>('/daily/reset', {
      method: 'POST',
    });
  },

  // Get daily task statistics
  getDailyTaskStats: async (startDate?: string, endDate?: string): Promise<any[]> => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<any[]>(`/daily/stats${query}`);
  },
};