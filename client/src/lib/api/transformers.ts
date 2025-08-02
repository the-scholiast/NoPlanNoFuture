import { WorkoutTemplate, CompletedWorkout, ExerciseDatabase } from '@/types/workoutTypes'
import { TaskData, CreateTaskData } from '@/types/todoTypes'

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

// Transform raw API response to TaskData
export function transformTaskData(data: any): TaskData {
  return {
    id: data.id,
    title: data.title,
    completed: data.completed,
    created_at: data.created_at || new Date().toISOString(),
    section: data.section,
    priority: data.priority,
    description: data.description || undefined,
    start_date: data.start_date || undefined,
    end_date: data.end_date || undefined,
    start_time: data.start_time || undefined,
    end_time: data.end_time || undefined
  }
}