import { TaskData, CreateTaskData } from '@/types/todoTypes';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Helper function to get auth token from Supabase
async function getAuthToken() {
  const { supabase } = await import('@/lib/supabaseClient');
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token;
}

// Helper function to make authenticated API requests
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('No authentication token available');
  }

  const url = `${API_BASE_URL}/api/todos${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
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

  // Delete a todo
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
};