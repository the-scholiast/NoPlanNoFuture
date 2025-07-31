import { 
  WorkoutTemplate, 
  CompletedWorkout, 
  ExerciseDatabase 
} from '@/types/workoutTypes'

// Transform raw API response to WorkoutTemplate. Handles potential data inconsistencies from backend
export function transformWorkoutTemplate(data: any): WorkoutTemplate {
  return {
    id: data.id,
    name: data.name || '',
    exercises: Array.isArray(data.exercises) 
      ? data.exercises.map((ex: any) => typeof ex === 'string' ? ex : ex.name || '')
      : [],
    is_public: Boolean(data.is_public),
    created_at: data.created_at,
    updated_at: data.updated_at
  }
}

// Transform raw API response to CompletedWorkout
export function transformCompletedWorkout(data: any): CompletedWorkout {
  return {
    id: data.id,
    name: data.name || '',
    template_id: data.template_id,
    exercises: Array.isArray(data.exercises) ? data.exercises : [],
    notes: data.notes,
    duration_minutes: data.duration_minutes,
    date: data.date || new Date().toISOString().split('T')[0],
    created_at: data.created_at
  }
}

// Transform raw API response to ExerciseDatabase
export function transformExerciseDatabase(data: any): ExerciseDatabase {
  return {
    id: data.id,
    name: data.name || '',
    is_custom: Boolean(data.is_custom),
    created_by: data.created_by
  }
}