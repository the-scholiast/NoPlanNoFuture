import { supabase } from '../utils/supabase.js';
import { ValidationError } from '../utils/errors.js';

// Retrieves exercises from the database with optional search filtering
export const getExercises = async (search) => {
  // Build the base query for exercises
  let query = supabase
    .from('exercises') // Select from the exercises table
    .select('*') // Get all columns
    .order('name'); // Sort alphabetically by exercise name
  
  // Apply search filter if search term is provided
  if (search) {
    query = query
      .ilike('name', `%${search}%`) // Case-insensitive partial match on exercise name
      .limit(10); // Limit search results to 10 exercises
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  
  return data || [];
};

// Creates a new custom exercise in the database for a user
export const createExercise = async (userId, exerciseData) => {
  const { name } = exerciseData;
  
  if (!name) {
    throw new ValidationError('Exercise name is required');
  }
  
  // Insert the new custom exercise into the database
  const { data, error } = await supabase
    .from('exercises')
    .insert({
      name, // Exercise name
      is_custom: true, // Mark as custom exercise
      created_by: userId // Track which user created this exercise
    })
    .select()
    .single(); 
  
  if (error) throw error;
  
  return data;
};