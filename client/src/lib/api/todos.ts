import { supabase } from '@/lib/supabaseClient'
import { TaskData, CreateTaskData } from '@/types/todoTypes';

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
      return (data || []).map(todo => ({
        id: todo.id,
        title: todo.title,
        completed: todo.completed,
        created_at: todo.created_at || new Date().toISOString(),
        section: todo.section,
        priority: todo.priority,
        description: todo.description,
        start_date: todo.start_date,
        end_date: todo.end_date,
        start_time: todo.start_time,
        end_time: todo.end_time
      }))
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
        .insert({
          user_id: user.id,
          title: todoData.title,
          section: todoData.section,
          priority: todoData.priority,
          start_date: todoData.start_date || null,
          end_date: todoData.end_date || null,
          start_time: todoData.start_time || null,
          end_time: todoData.end_time || null,
        })
        .select()
        .single()

      if (error) throw error

      // Transform to Task format
      return {
        id: data.id,
        title: data.title,
        completed: data.completed,
        created_at: data.created_at,
        section: data.section as 'daily' | 'today' | 'upcoming',
        priority: data.priority as 'low' | 'medium' | 'high',
        start_date: data.start_date || undefined,
        end_date: data.end_date || undefined,
        start_time: data.start_time || undefined,
        end_time: data.end_time || undefined,
      }
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

      const todosToInsert = todosData.map(todo => ({
        user_id: user.id,
        title: todo.title,
        section: todo.section,
        priority: todo.priority,
        start_date: todo.start_date || null,
        end_date: todo.end_date || null,
        start_time: todo.start_time || null,
        end_time: todo.end_time || null,
      }))

      const { data, error } = await supabase
        .from('todos')
        .insert(todosToInsert)
        .select()

      if (error) throw error

      // Transform to Task format
      return (data || []).map(todo => ({
        id: todo.id,
        title: todo.title,
        completed: todo.completed,
        created_at: todo.created_at,
        section: todo.section as 'daily' | 'today' | 'upcoming',
        priority: todo.priority as 'low' | 'medium' | 'high' | undefined,
        start_date: todo.start_date || undefined,
        end_date: todo.end_date || undefined,
        start_time: todo.start_time || undefined,
        end_time: todo.end_time || undefined,
      }))
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
      const dbUpdates: any = {}
      if (updates.title !== undefined) dbUpdates.title = updates.title
      if (updates.completed !== undefined) dbUpdates.completed = updates.completed
      if (updates.section !== undefined) dbUpdates.section = updates.section
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority
      if (updates.start_date !== undefined) dbUpdates.start_date = updates.start_date
      if (updates.end_date !== undefined) dbUpdates.end_date = updates.end_date
      if (updates.start_time !== undefined) dbUpdates.start_time = updates.start_time
      if (updates.end_time !== undefined) dbUpdates.end_time = updates.end_time

      const { data, error } = await supabase
        .from('todos')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      // Transform to Task format
      return {
        id: data.id,
        title: data.title,
        completed: data.completed,
        created_at: data.created_at,
        section: data.section as 'daily' | 'today' | 'upcoming',
        priority: data.priority as 'low' | 'medium' | 'high' | undefined,
        start_date: data.start_date || undefined,
        end_date: data.end_date || undefined,
        start_time: data.start_time || undefined,
        end_time: data.end_time || undefined,
      }
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

  // Toggle the completed status of a todo
  toggleComplete: async (id: string, currentStatus: boolean): Promise<TaskData> => {
    return todoApi.update(id, { completed: !currentStatus });
  },

  // Update only the title of a todo
  updateTitle: async (id: string, title: string): Promise<TaskData> => {
    return todoApi.update(id, { title });
  }
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