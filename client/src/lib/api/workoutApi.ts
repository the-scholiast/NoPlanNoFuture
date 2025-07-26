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
// TYPE DEFINITIONS (keeping your existing format)
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
    // Return some fallback templates for testing
    return [
      {
        name: "Push Day Template",
        exercises: ["Bench Press", "Overhead Press", "Incline Press", "Tricep Dips", "Lateral Raises"]
      },
      {
        name: "Pull Day Template",
        exercises: ["Pull-ups", "Deadlifts", "Bent-over Rows", "Lat Pulldowns", "Bicep Curls"]
      },
      {
        name: "Leg Day Template",
        exercises: ["Squats", "Leg Press", "Lunges", "Leg Curls", "Calf Raises"]
      }
    ]
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
    // Transform to backend format
    const backendTemplate = {
      name: template.name,
      exercises: template.exercises.map((exerciseName, index) => ({
        id: `temp-${index}`,
        name: exerciseName,
        sets: []
      })),
      is_public: template.is_public || false
    }

    const data = await apiCall('/workout-templates', {
      method: 'POST',
      body: JSON.stringify(backendTemplate)
    })

    // Transform back to frontend format
    return {
      id: data.id,
      name: data.name,
      exercises: data.exercises?.map((ex: any) => ex.name) || [],
      is_public: data.is_public,
      created_at: data.created_at,
      updated_at: data.updated_at
    }
  } catch (error) {
    console.error('Error creating workout template:', error)
    return null
  }
}

// =============================================
// EXERCISE DATABASE
// =============================================

/**
 * Get all exercises from the database
 */
export async function getExerciseDatabase(): Promise<string[]> {
  try {
    const data = await apiCall('/exercises')
    return data.map((exercise: ExerciseDatabase) => exercise.name) || []
  } catch (error) {
    console.error('Error fetching exercise database:', error)
    // Fallback to basic exercises if API fails
    return [
      // Chest exercises
      "Bench Press", "Incline Bench Press", "Decline Bench Press", "Dumbbell Bench Press",
      "Cable Flyes", "Dumbbell Flyes", "Push-ups", "Diamond Push-ups",

      // Shoulder exercises
      "Overhead Press", "Military Press", "Push Press", "Seated Shoulder Press",
      "Lateral Raises", "Front Raises", "Rear Delt Flyes", "Upright Rows",

      // Leg exercises
      "Squat", "Front Squat", "Back Squat", "Bulgarian Split Squat",
      "Leg Press", "Leg Curls", "Leg Extensions", "Calf Raises",
      "Lunges", "Walking Lunges", "Reverse Lunges", "Jump Lunges",

      // Back exercises
      "Deadlift", "Romanian Deadlift", "Sumo Deadlift", "Stiff Leg Deadlift",
      "Pull-ups", "Chin-ups", "Lat Pulldowns", "Wide Grip Pulldowns",
      "Bent-over Rows", "Barbell Rows", "Dumbbell Rows", "Cable Rows",

      // Arm exercises
      "Tricep Dips", "Close Grip Bench Press", "Tricep Extensions",
      "Bicep Curls", "Hammer Curls", "Preacher Curls", "Cable Curls"
    ]
  }
}

/**
 * Search exercises by name
 */
export async function searchExercises(searchTerm: string): Promise<string[]> {
  try {
    const data = await apiCall(`/exercises?search=${encodeURIComponent(searchTerm)}`)
    return data.map((exercise: ExerciseDatabase) => exercise.name) || []
  } catch (error) {
    console.error('Error searching exercises:', error)
    return []
  }
}

// =============================================
// COMPLETED WORKOUTS
// =============================================

/**
 * Save a completed workout
 */
export async function saveCompletedWorkout(workout: {
  name: string
  exercises: Exercise[]
  notes?: string
  duration_minutes?: number
}): Promise<CompletedWorkout | null> {
  try {
    const workoutData = {
      name: workout.name,
      exercises: workout.exercises,
      notes: workout.notes || '',
      duration_minutes: workout.duration_minutes || 0,
      date: new Date().toISOString()
    }

    const data = await apiCall('/workouts', {
      method: 'POST',
      body: JSON.stringify(workoutData)
    })

    return data
  } catch (error) {
    console.error('Error saving completed workout:', error)
    return null
  }
}

/**
 * Get completed workouts for the authenticated user
 */
export async function getCompletedWorkouts(limit?: number): Promise<CompletedWorkout[]> {
  try {
    const endpoint = limit ? `/workouts?limit=${limit}` : '/workouts'
    const data = await apiCall(endpoint)
    return data || []
  } catch (error) {
    console.error('Error fetching completed workouts:', error)
    return []
  }
}