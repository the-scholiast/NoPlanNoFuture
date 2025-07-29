// client/src/lib/api/workoutApi.ts

import { supabase } from '@/lib/supabaseClient'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

// Helper function to get auth headers
async function getAuthHeaders() {
  try {
    // Force a fresh session check
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.error('Session error:', error)
      throw new Error(`Session error: ${error.message}`)
    }

    if (!session) {
      console.error('No session found')
      // Try to refresh the session
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()

      if (refreshError || !refreshedSession) {
        throw new Error('No authentication session - please login again')
      }

      console.log('✅ Session refreshed successfully')
      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${refreshedSession.access_token}`
      }
    }

    if (!session.access_token) {
      throw new Error('No access token in session')
    }

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000)
    if (session.expires_at && session.expires_at < now) {
      console.log('Token expired, refreshing...')
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()

      if (refreshError || !refreshedSession) {
        throw new Error('Token expired and refresh failed - please login again')
      }

      return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${refreshedSession.access_token}`
      }
    }

    console.log('✅ Using valid token:', session.access_token.substring(0, 20) + '...')

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    }
  } catch (error) {
    console.error('❌ Auth error:', error)
    throw error
  }
}

// Helper function for API calls
async function apiCall(endpoint: string, options: RequestInit = {}) {
  const headers = await getAuthHeaders()

  const response = await fetch(`${API_BASE}/api${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers
    }
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return response.json()
}

// =============================================
// TYPE DEFINITIONS
// =============================================

export interface WorkoutTemplate {
  id?: string
  name: string
  exercises: string[]  // Keep as string array to match your component
  is_public?: boolean
  created_at?: string
  updated_at?: string
}

export interface Exercise {
  id: string
  name: string
  sets: Set[]
}

export interface Set {
  id: string
  weight: number
  reps: number
  completed?: boolean
}

export interface ExerciseDatabase {
  id: string
  name: string
  is_custom: boolean
  created_by?: string
}

export interface CompletedWorkout {
  id?: string
  name: string
  template_id?: string
  exercises: Exercise[]
  notes?: string
  duration_minutes?: number
  date: string
  created_at?: string
}

// =============================================
// WORKOUT TEMPLATES
// =============================================

/**
 * Get all workout templates for the authenticated user
 */
export async function getWorkoutTemplates(): Promise<WorkoutTemplate[]> {
  try {
    const data = await apiCall('/workout-templates')

    // Transform backend format to frontend format
    return data.map((template: any) => ({
      id: template.id,
      name: template.name,
      exercises: Array.isArray(template.exercises)
        ? template.exercises.map((ex: any) => typeof ex === 'string' ? ex : ex.name)
        : [],
      is_public: template.is_public,
      created_at: template.created_at,
      updated_at: template.updated_at
    }))
  } catch (error) {
    console.error('Error fetching workout templates:', error)
    // Return empty array instead of fallback templates
    return []
  }
}

/**
 * Create a new workout template
 */
export async function createWorkoutTemplate(template: {
  name: string
  exercises: string[]
  is_public?: boolean
}): Promise<WorkoutTemplate | null> {
  try {
    const data = await apiCall('/workout-templates', {
      method: 'POST',
      body: JSON.stringify(template)
    })

    return {
      id: data.id,
      name: data.name,
      exercises: Array.isArray(data.exercises)
        ? data.exercises.map((ex: any) => typeof ex === 'string' ? ex : ex.name)
        : [],
      is_public: data.is_public,
      created_at: data.created_at,
      updated_at: data.updated_at
    }
  } catch (error) {
    console.error('Error creating workout template:', error)
    return null
  }
}

/**
 * Update an existing workout template
 */
export async function updateWorkoutTemplate(
  id: string,
  updates: Partial<WorkoutTemplate>
): Promise<WorkoutTemplate | null> {
  try {
    const data = await apiCall(`/workout-templates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    })

    return {
      id: data.id,
      name: data.name,
      exercises: Array.isArray(data.exercises)
        ? data.exercises.map((ex: any) => typeof ex === 'string' ? ex : ex.name)
        : [],
      is_public: data.is_public,
      created_at: data.created_at,
      updated_at: data.updated_at
    }
  } catch (error) {
    console.error('Error updating workout template:', error)
    return null
  }
}

/**
 * Delete a workout template
 */
export async function deleteWorkoutTemplate(id: string): Promise<boolean> {
  try {
    await apiCall(`/workout-templates/${id}`, {
      method: 'DELETE'
    })
    return true
  } catch (error) {
    console.error('Error deleting workout template:', error)
    return false
  }
}

// =============================================
// COMPLETED WORKOUTS
// =============================================

/**
 * Get user's completed workouts
 */
export async function getCompletedWorkouts(limit?: number): Promise<CompletedWorkout[]> {
  try {
    const url = limit ? `/completed-workouts?limit=${limit}` : '/completed-workouts'
    const data = await apiCall(url)

    return data.map((workout: any) => ({
      id: workout.id,
      name: workout.name,
      template_id: workout.template_id,
      exercises: workout.exercises || [],
      notes: workout.notes,
      duration_minutes: workout.duration_minutes,
      date: workout.date,
      created_at: workout.created_at
    }))
  } catch (error) {
    console.error('Error fetching completed workouts:', error)
    return []
  }
}

/**
 * Save a completed workout
 */
export async function saveCompletedWorkout(workout: {
  name: string
  template_id?: string
  exercises: Exercise[]
  notes?: string
  duration_minutes?: number
  date: string
}): Promise<CompletedWorkout | null> {
  try {
    const data = await apiCall('/completed-workouts', {
      method: 'POST',
      body: JSON.stringify(workout)
    })

    return {
      id: data.id,
      name: data.name,
      template_id: data.template_id,
      exercises: data.exercises || [],
      notes: data.notes,
      duration_minutes: data.duration_minutes,
      date: data.date,
      created_at: data.created_at
    }
  } catch (error) {
    console.error('Error saving completed workout:', error)
    return null
  }
}

/**
 * Update a completed workout
 */
export async function updateCompletedWorkout(
  id: string,
  updates: Partial<CompletedWorkout>
): Promise<CompletedWorkout | null> {
  try {
    const data = await apiCall(`/completed-workouts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    })

    return {
      id: data.id,
      name: data.name,
      template_id: data.template_id,
      exercises: data.exercises || [],
      notes: data.notes,
      duration_minutes: data.duration_minutes,
      date: data.date,
      created_at: data.created_at
    }
  } catch (error) {
    console.error('Error updating completed workout:', error)
    return null
  }
}

/**
 * Delete a completed workout
 */
export async function deleteCompletedWorkout(id: string): Promise<boolean> {
  try {
    await apiCall(`/completed-workouts/${id}`, {
      method: 'DELETE'
    })
    return true
  } catch (error) {
    console.error('Error deleting completed workout:', error)
    return false
  }
}

// =============================================
// EXERCISE DATABASE
// =============================================

/**
 * Get all exercises from the database (built-in + user custom)
 */
export async function getExerciseDatabase(): Promise<ExerciseDatabase[]> {
  try {
    const data = await apiCall('/exercises')
    return data || []
  } catch (error) {
    console.error('Error fetching exercise database:', error)
    return []
  }
}

/**
 * Create a custom exercise
 */
export async function createCustomExercise(name: string): Promise<ExerciseDatabase | null> {
  try {
    const data = await apiCall('/exercises', {
      method: 'POST',
      body: JSON.stringify({ name })
    })

    return {
      id: data.id,
      name: data.name,
      is_custom: data.is_custom,
      created_by: data.created_by
    }
  } catch (error) {
    console.error('Error creating custom exercise:', error)
    return null
  }
}