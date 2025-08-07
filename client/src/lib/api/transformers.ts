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
    completed: data.completed === true || data.completed === "TRUE" || data.completed === "true" || data.completed === 1,
    completed_at: data.completed_at || undefined,
    created_at: data.created_at || new Date().toISOString(),
    section: data.section,
    priority: data.priority,
    description: data.description || undefined,
    start_date: data.start_date || undefined,
    end_date: data.end_date || undefined,
    start_time: data.start_time || undefined,
    end_time: data.end_time || undefined,
    is_recurring: data.is_recurring || false,
    recurring_days: data.recurring_days || undefined,
    parent_task_id: data.parent_task_id || undefined,
    completion_count: data.completion_count || undefined,
    last_completed_date: data.last_completed_date || undefined,
    deleted_at: data.deleted_at || undefined
  }
}

// Transform data to CreateTaskData
export function transformCreateTaskData(data: any): CreateTaskData {
  return {
    title: data.title.trim(),
    section: data.section,
    priority: data.priority,
    description: data.description?.trim() || undefined,
    start_date: data.start_date || undefined,
    end_date: data.end_date || undefined,
    start_time: data.start_time || undefined,
    end_time: data.end_time || undefined,
    is_recurring: data.is_recurring || false,
    recurring_days: data.recurring_days || undefined,
  }
}

// Transform CreateTaskData to backend format with userID
export function formatCreateTaskData(data: CreateTaskData, user: string) {
  return {
    user_id: user,
    title: data.title,
    section: data.section,
    priority: data.priority,
    description: data.description || null,
    start_date: data.start_date || null,
    end_date: data.end_date || null,
    start_time: data.start_time || null,
    end_time: data.end_time || null,
    is_recurring: data.is_recurring || false,            
    recurring_days: data.recurring_days || null,         
  }
}

// Obtain only the updated keys and values
export function updateTaskData(updates: Partial<Omit<TaskData, 'id' | 'created_at'>>) {
  const dbUpdates: any = {}

  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      dbUpdates[key] = value
    }
  })

  return dbUpdates
}