import { ValidationError } from '../utils/errors.js';
import supabase from "../supabaseAdmin.js";

// Query the workout_templates table in Supabase
export const getWorkoutTemplates = async (userId) => {
  const { data, error } = await supabase
    .from('workout_templates')
    .select("*") // Get all columns
    .eq('user_id', userId) // Filter by the provided user ID
    .order('created_at', { ascending: false }); // Sort by creation date, newest first

  if (error) throw error;

  return data || [];
}

// Creates a new workout template in the database for a specific user
export const createWorkoutTemplate = async (userId, templateData) => {
  const { name, exercises, is_public } = templateData;

  if (!name || !exercises) {
    throw new ValidationError('Name and exercises are required')
  }

  // Insert the new workout template into the database
  const { data, error } = await supabase
    .from('workout_templates') // Fixed typo: was 'workout_tempaltes'
    .insert({
      user_id: userId,
      name,
      exercises,
      is_public: is_public || false
    })
    .select() // Return the inserted template
    .single(); // Return as an object instead of an array

  if (error) throw error;

  return data;
}

// Updates an existing workout template for a specific user
export const updateWorkoutTemplate = async (userId, templateId, updates) => { // Fixed typo: was 'tempalteId'
  const { data, error } = await supabase
    .from('workout_templates')
    .update(updates)
    .eq('id', templateId) // Match the templateId
    .eq('user_id', userId) // Ensure user owns the template
    .select() // Return the updated template
    .single(); // Return as an object instead of an array

  if (error) throw error;

  return data;
}

// Deletes a workout template from the database for a specific user
export const deleteWorkoutTemplate = async (userId, templateId) => {
  const { error } = await supabase
    .from('workout_templates')
    .delete()
    .eq('id', templateId) // Match the specific template by ID
    .eq('user_id', userId); // Ensure user owns the template

  if (error) throw error;

  // Return success confirmation
  return { success: true };
};

// Creates a new workout in the database for a specific user
export const createWorkout = async (userId, workoutData) => {
  const { name, exercises, date, duration, notes } = workoutData;

  if (!name || !exercises) {
    throw new ValidationError('Name and exercises are required');
  }

  // Insert the new workout into the database
  const { data, error } = await supabase
    .from('workouts')
    .insert({
      user_id: userId,
      name,
      exercises,
      date: date || new Date().toISOString().split('T')[0], // Default to today if no date provided
      duration,
      notes
    })
    .select() // Return the inserted workout
    .single(); // Return as an object instead of an array

  if (error) throw error;

  return data;
};

// Retrieves a single workout by ID for a specific user
export const getWorkoutById = async (userId, workoutId) => {
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('id', workoutId) // Match the specific workout by ID
    .eq('user_id', userId) // Ensure user owns the workout
    .single(); // Return as an object instead of an array

  if (error) throw error;

  return data;
};

// Retrieves workouts for a specific user with optional filtering and limiting
export const getWorkouts = async (userId, { limit, date }) => {
  // Build the base query for workouts
  let query = supabase
    .from('workouts')
    .select('*')
    .eq('user_id', userId) // Filter by the provided user ID
    .order('date', { ascending: false }); // Sort by date, newest first

  // Apply date filter if specified (gets workouts for a specific date)
  if (date) {
    query = query.eq('date', date);
  }

  // Apply limit if specified and no specific date is requested
  // Limit is ignored when filtering by date to get all workouts for that day
  if (limit && !date) {
    query = query.limit(parseInt(limit));
  }

  const { data, error } = await query;

  if (error) throw error;

  return data || [];
};

// Updates an existing workout for a specific user
export const updateWorkout = async (userId, workoutId, updates) => {
  const { data, error } = await supabase
    .from('workouts')
    .update(updates)
    .eq('id', workoutId) // Match the specific workout by ID
    .eq('user_id', userId) // Ensure user owns the workout 
    .select()
    .single();

  if (error) throw error;

  return data;
};

// Deletes a workout from the database for a user
export const deleteWorkout = async (userId, workoutId) => {
  const { error } = await supabase
    .from('workouts')
    .delete() // Perform delete operation
    .eq('id', workoutId) // Match the specific workout by ID
    .eq('user_id', userId); // Ensure user owns the workout

  if (error) throw error;

  return { success: true };
};