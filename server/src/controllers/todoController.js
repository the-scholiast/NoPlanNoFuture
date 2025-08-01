import { supabase } from '../utils/supabase.js';
import { transformTodoFromDB, transformTodoToDB } from '../utils/transformers.js';
import { ValidationError } from '../utils/errors.js';

// Fetches all todos for a specific user from the Supabase todos table
export const getAllTodos = async (userId) => {
  const { data, error } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false }); // Returns by creation date (newest first)

  if (error) throw error;

  return data.map(transformTodoFromDB);
};

// Creates a new todo in the database
export const createTodo = async (userId, todoData) => {
  const { title, section, priority, startDate, endDate, startTime, endTime, description } = todoData;

  if (!title || !section) {
    throw new ValidationError('Title and section are required');
  }

  const { data, error } = await supabase
    .from('todos')
    .insert({
      user_id: userId,
      title,
      section,
      priority: priority || null,
      description: description || "",
      start_date: startDate || null,
      end_date: endDate || null,
      start_time: startTime || null,
      end_time: endTime || null
    })
    .select()
    .single();

  if (error) throw error;

  return transformTodoFromDB(data);
};

// Updates an existing todo's fields
export const updateTodo = async (userId, todoId, updates) => {
  const dbUpdates = transformTodoToDB(updates);

  const { data, error } = await supabase
    .from('todos')
    .update(dbUpdates)
    .eq('id', todoId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;

  return transformTodoFromDB(data);
};

// Deletes a specific todo
export const deleteTodo = async (userId, todoId) => {
  const { error } = await supabase
    .from('todos')
    .delete()
    .eq('id', todoId)
    .eq('user_id', userId);

  if (error) throw error;

  return { success: true };
};

// Bulk deletion functionality
export const bulkDeleteTodos = async (userId, { section, completed }) => {
  // Build the base delete query, ensuring only the user's todos can be deleted
  let query = supabase
    .from('todos')
    .delete()
    .eq('user_id', userId);

  // Apply section filter if specified
  if (section) {
    query = query.eq('section', section);
  }
  
  // Apply completion status filter if specified 
  if (completed !== undefined) {
    query = query.eq('completed', completed);
  }

  // Execute the delete query and return the deleted records for counting
  const { data, error } = await query.select();

  if (error) throw error;

  // Return success confirmation with count of deleted items
  return { success: true, deleted: data?.length || 0 };
};