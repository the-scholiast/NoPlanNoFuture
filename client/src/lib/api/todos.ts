import { supabase } from '@/lib/supabaseClient'
import { TaskData, CreateTaskData } from '@/types/todoTypes';
import { transformTaskData, formatCreateTaskData, updateTaskData } from './transformers';

// API FUNCTIONS

export const todoApi = {
  // Fetch all todos from the database
  getAll: async (): Promise<TaskData[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Transform database format to Task format
      return (data || []).map(transformTaskData)
    } catch (error) {
      console.error('Failed to fetch todos:', error);
      throw error;
    }
  },

  // Create a new todo
  create: async (todoData: CreateTaskData): Promise<TaskData> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      const { data, error } = await supabase
        .from('todos')
        .insert(formatCreateTaskData(todoData, user.id))
        .select()
        .single()

      if (error) throw error

      // Transform to Task format
      return transformTaskData(data)
    } catch (error) {
      console.error('Failed to create todo:', error);
      throw error;
    }
  },

  // Create multiple todos at once
  createMany: async (todosData: CreateTaskData[]): Promise<TaskData[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      const todosToInsert = todosData.map(todo => formatCreateTaskData(todo, user.id))

      const { data, error } = await supabase
        .from('todos')
        .insert(todosToInsert)
        .select()

      if (error) throw error

      // Transform to Task format
      return (data || []).map(transformTaskData)
    } catch (error) {
      console.error('Failed to create multiple todos:', error);
      throw error;
    }
  },

  // Update an existing todo
  update: async (id: string, updates: Partial<Omit<TaskData, 'id' | 'created_at'>>): Promise<TaskData> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      // Transform updates to database format
      const dbUpdates = updateTaskData(updates)

      const { data, error } = await supabase
        .from('todos')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      // Transform to Task format
      return transformTaskData(data)
    } catch (error) {
      console.error('Failed to update todo:', error);
      throw error;
    }
  },

  // Delete a specific todo
  delete: async (id: string): Promise<{ success: boolean }> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      return { success: true }
    } catch (error) {
      console.error('Failed to delete todo:', error);
      throw error;
    }
  },

  // Delete completed todos in a specific section
  deleteCompleted: async (section: 'daily' | 'today' | 'upcoming'): Promise<{ success: boolean; deleted: number }> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      const { data, error } = await supabase
        .from('todos')
        .delete()
        .eq('user_id', user.id)
        .eq('section', section)
        .eq('completed', true)
        .select()

      if (error) throw error

      return { success: true, deleted: data?.length || 0 }
    } catch (error) {
      console.error('Failed to delete completed todos:', error);
      throw error;
    }
  },

  // Delete all todos in a specific section
  deleteAll: async (section: 'daily' | 'today' | 'upcoming'): Promise<{ success: boolean; deleted: number }> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      const { data, error } = await supabase
        .from('todos')
        .delete()
        .eq('user_id', user.id)
        .eq('section', section)
        .select()

      if (error) throw error

      return { success: true, deleted: data?.length || 0 }
    } catch (error) {
      console.error('Failed to delete all todos:', error);
      throw error;
    }
  },

};

// =============================================
// EVENT UTILITIES
// =============================================

export const todoEvents = {
  // Dispatch event when todos are added
  dispatchTodoAdded: () => {
    window.dispatchEvent(new CustomEvent('todoAdded'));
  },

  // Dispatch event when todos are updated
  dispatchTodoUpdated: () => {
    window.dispatchEvent(new CustomEvent('todoUpdated'));
  },

  // Listen for todo events
  onTodoChange: (callback: () => void) => {
    const handleTodoAdded = () => callback();
    const handleTodoUpdated = () => callback();

    window.addEventListener('todoAdded', handleTodoAdded);
    window.addEventListener('todoUpdated', handleTodoUpdated);

    // Return cleanup function
    return () => {
      window.removeEventListener('todoAdded', handleTodoAdded);
      window.removeEventListener('todoUpdated', handleTodoUpdated);
    };
  }
};