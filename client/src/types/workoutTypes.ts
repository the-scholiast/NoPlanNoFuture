// Represents a single set within an exercise
export interface Set {
  id: string;
  weight: number; // Weight used in pounds
  reps: number; // Number of repetitions performed
  completed?: boolean; // Whether this set has been completed
}

// Represents an exercise within a workout
export interface Exercise {
  id: string;
  name: string; // Name of the exercise
  sets: Set[]; // Array of sets performed for this exercise
}

// Represents a workout template for reuse
export interface WorkoutTemplate {
  id?: string; // Add id to match API
  name: string; // Name of the template
  exercises: string[]; // Array of exercise names included in the template
  is_public?: boolean; // Whether the template is publicly available
  created_at?: string; // Timestamp when created
  updated_at?: string; // Timestamp when updated
}

// Represents an exercise in the database (built-in + custom)
export interface ExerciseDatabase {
  id: string;
  name: string;
  is_custom: boolean;
  created_by?: string;
}

// Represents a completed workout
export interface CompletedWorkout {
  id?: string; // Make optional for creation
  name: string; // Name of the workout
  template_id?: string; // Reference to template used
  exercises: Exercise[]; // Array of exercises performed (not any[])
  notes?: string; // Optional notes about the workout
  duration_minutes?: number; // Duration of the workout in minutes
  date: string; // Date the workout was performed (YYYY-MM-DD format)
  created_at?: string; // Timestamp when the workout was created
}

// Request types for creating/updating
export interface CreateWorkoutTemplateRequest {
  name: string;
  exercises: string[];
  is_public?: boolean;
}

export interface UpdateWorkoutTemplateRequest {
  name?: string;
  exercises?: string[];
  is_public?: boolean;
}

export interface SaveCompletedWorkoutRequest {
  name: string;
  template_id?: string;
  exercises: Exercise[];
  notes?: string;
  duration_minutes?: number;
  date?: string;
}

export interface UpdateCompletedWorkoutRequest {
  name?: string;
  exercises?: Exercise[];
  notes?: string;
  duration_minutes?: number;
}

export interface CreateCustomExerciseRequest {
  name: string;
}

// Response wrapper types (Not implemented currently)
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ApiError {
  error: string;
  message?: string;
  status?: number;
}