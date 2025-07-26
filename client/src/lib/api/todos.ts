import { supabase } from '@/lib/supabaseClient'

// =============================================
// TYPE DEFINITIONS
// =============================================

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  section: 'daily' | 'today' | 'upcoming';
  priority?: 'low' | 'medium' | 'high';
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
}

export interface CreateTaskData {
  title: string;
  section: 'daily' | 'today' | 'upcoming';
  priority: 'low' | 'medium' | 'high';
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
}

// =============================================
// API FUNCTIONS
// =============================================

export const todoApi = {
  /**
   * Fetch all todos from the database
   */
  getAll: async (): Promise<Task[]> => {
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
        createdAt: new Date(todo.created_at),
        section: todo.section as 'daily' | 'today' | 'upcoming',
        priority: todo.priority as 'low' | 'medium' | 'high' | undefined,
        startDate: todo.start_date || undefined,
        endDate: todo.end_date || undefined,
        startTime: todo.start_time || undefined,
        endTime: todo.end_time || undefined,
      }))
    } catch (error) {
      console.error('Failed to fetch todos:', error);
      throw error;
    }
  },

  /**
   * Create a new todo
   */
  create: async (todoData: CreateTaskData): Promise<Task> => {
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
          start_date: todoData.startDate || null,
          end_date: todoData.endDate || null,
          start_time: todoData.startTime || null,
          end_time: todoData.endTime || null,
        })
        .select()
        .single()

      if (error) throw error

      // Transform to Task format
      return {
        id: data.id,
        title: data.title,
        completed: data.completed,
        createdAt: new Date(data.created_at),
        section: data.section as 'daily' | 'today' | 'upcoming',
        priority: data.priority as 'low' | 'medium' | 'high' | undefined,
        startDate: data.start_date || undefined,
        endDate: data.end_date || undefined,
        startTime: data.start_time || undefined,
        endTime: data.end_time || undefined,
      }
    } catch (error) {
      console.error('Failed to create todo:', error);
      throw error;
    }
  },

  /**
   * Create multiple todos at once
   */
  createMany: async (todosData: CreateTaskData[]): Promise<Task[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      const todosToInsert = todosData.map(todo => ({
        user_id: user.id,
        title: todo.title,
        section: todo.section,
        priority: todo.priority,
        start_date: todo.startDate || null,
        end_date: todo.endDate || null,
        start_time: todo.startTime || null,
        end_time: todo.endTime || null,
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
        createdAt: new Date(todo.created_at),
        section: todo.section as 'daily' | 'today' | 'upcoming',
        priority: todo.priority as 'low' | 'medium' | 'high' | undefined,
        startDate: todo.start_date || undefined,
        endDate: todo.end_date || undefined,
        startTime: todo.start_time || undefined,
        endTime: todo.end_time || undefined,
      }))
    } catch (error) {
      console.error('Failed to create multiple todos:', error);
      throw error;
    }
  },

  /**
   * Update an existing todo
   */
  update: async (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>): Promise<Task> => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No authenticated user')

      // Transform updates to database format
      const dbUpdates: any = {}
      if (updates.title !== undefined) dbUpdates.title = updates.title
      if (updates.completed !== undefined) dbUpdates.completed = updates.completed
      if (updates.section !== undefined) dbUpdates.section = updates.section
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority
      if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate
      if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate
      if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime
      if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime

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
        createdAt: new Date(data.created_at),
        section: data.section as 'daily' | 'today' | 'upcoming',
        priority: data.priority as 'low' | 'medium' | 'high' | undefined,
        startDate: data.start_date || undefined,
        endDate: data.end_date || undefined,
        startTime: data.start_time || undefined,
        endTime: data.end_time || undefined,
      }
    } catch (error) {
      console.error('Failed to update todo:', error);
      throw error;
    }
  },

  /**
   * Delete a specific todo
   */
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

  /**
   * Delete completed todos in a specific section
   */
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

  /**
   * Delete all todos in a specific section
   */
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

  /**
   * Toggle the completed status of a todo
   */
  toggleComplete: async (id: string, currentStatus: boolean): Promise<Task> => {
    return todoApi.update(id, { completed: !currentStatus });
  },

  /**
   * Update only the title of a todo
   */
  updateTitle: async (id: string, title: string): Promise<Task> => {
    return todoApi.update(id, { title });
  }
};

// =============================================
// EVENT UTILITIES
// =============================================

export const todoEvents = {
  /**
   * Dispatch event when todos are added
   */
  dispatchTodoAdded: () => {
    window.dispatchEvent(new CustomEvent('todoAdded'));
  },

  /**
   * Dispatch event when todos are updated
   */
  dispatchTodoUpdated: () => {
    window.dispatchEvent(new CustomEvent('todoUpdated'));
  },

  /**
   * Listen for todo events
   */
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

// =============================================
// PLACEHOLDER DATA (for fallback)
// =============================================

export const placeholderTodos: Task[] = [
  {
    id: '1',
    title: 'Morning Exercise',
    completed: false,
    createdAt: new Date(),
    section: 'daily',
    priority: 'high',
    startTime: '07:00',
    endTime: '08:00'
  },
  {
    id: '2',
    title: 'Review Daily Goals',
    completed: true,
    createdAt: new Date(),
    section: 'daily',
    priority: 'medium'
  },
  {
    id: '3',
    title: 'Team Meeting',
    completed: false,
    createdAt: new Date(),
    section: 'today',
    priority: 'high',
    startDate: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '11:00'
  },
  {
    id: '4',
    title: 'Project Deadline',
    completed: false,
    createdAt: new Date(),
    section: 'upcoming',
    priority: 'high',
    startDate: '2025-02-01',
    endDate: '2025-02-01'
  }
];