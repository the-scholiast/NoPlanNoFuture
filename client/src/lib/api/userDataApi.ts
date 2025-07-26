import { supabase } from '@/lib/supabaseClient'

// =============================================
// TYPE DEFINITIONS
// =============================================

export interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar_url: string
  created_at: string
  updated_at: string
}

export interface WorkoutTemplate {
  id?: string
  user_id?: string
  name: string
  exercises: Exercise[]
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

export interface CompletedWorkout {
  id?: string
  user_id?: string
  name: string
  template_id?: string
  exercises: Exercise[]
  notes?: string
  duration_minutes?: number
  date: string
  created_at?: string
}

export interface ExerciseDatabase {
  id: string
  name: string
  is_custom: boolean
  created_by?: string
}

// =============================================
// USER PROFILE OPERATIONS
// =============================================

/**
 * Get current user's profile
 */
export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
}

/**
 * Update user profile
 */
export const updateUserProfile = async (updates: Partial<UserProfile>): Promise<UserProfile | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No authenticated user')

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating user profile:', error)
    return null
  }
}

// =============================================
// WORKOUT TEMPLATE OPERATIONS
// =============================================

/**
 * Get user's workout templates
 */
export const getWorkoutTemplates = async (): Promise<WorkoutTemplate[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('workout_templates')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching workout templates:', error)
    return []
  }
}

/**
 * Create a new workout template
 */
export const createWorkoutTemplate = async (template: Omit<WorkoutTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<WorkoutTemplate | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No authenticated user')

    const { data, error } = await supabase
      .from('workout_templates')
      .insert({
        user_id: user.id,
        name: template.name,
        exercises: template.exercises,
        is_public: template.is_public || false
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating workout template:', error)
    return null
  }
}

/**
 * Update a workout template
 */
export const updateWorkoutTemplate = async (id: string, updates: Partial<WorkoutTemplate>): Promise<WorkoutTemplate | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No authenticated user')

    const { data, error } = await supabase
      .from('workout_templates')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating workout template:', error)
    return null
  }
}

/**
 * Delete a workout template
 */
export const deleteWorkoutTemplate = async (id: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No authenticated user')

    const { error } = await supabase
      .from('workout_templates')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting workout template:', error)
    return false
  }
}

// =============================================
// COMPLETED WORKOUT OPERATIONS
// =============================================

/**
 * Get user's completed workouts
 */
export const getCompletedWorkouts = async (limit?: number): Promise<CompletedWorkout[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    let query = supabase
      .from('workouts')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching completed workouts:', error)
    return []
  }
}

/**
 * Save a completed workout
 */
export const saveCompletedWorkout = async (workout: Omit<CompletedWorkout, 'id' | 'user_id' | 'created_at'>): Promise<CompletedWorkout | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No authenticated user')

    const { data, error } = await supabase
      .from('workouts')
      .insert({
        user_id: user.id,
        name: workout.name,
        template_id: workout.template_id,
        exercises: workout.exercises,
        notes: workout.notes,
        duration_minutes: workout.duration_minutes,
        date: workout.date
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error saving completed workout:', error)
    return null
  }
}

/**
 * Update a completed workout
 */
export const updateCompletedWorkout = async (id: string, updates: Partial<CompletedWorkout>): Promise<CompletedWorkout | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No authenticated user')

    const { data, error } = await supabase
      .from('workouts')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating completed workout:', error)
    return null
  }
}

/**
 * Delete a completed workout
 */
export const deleteCompletedWorkout = async (id: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No authenticated user')

    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting completed workout:', error)
    return false
  }
}

// =============================================
// EXERCISE DATABASE OPERATIONS
// =============================================

/**
 * Get all exercises from the database
 */
export const getExercises = async (): Promise<ExerciseDatabase[]> => {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('name')

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching exercises:', error)
    return []
  }
}

/**
 * Search exercises by name
 */
export const searchExercises = async (searchTerm: string): Promise<ExerciseDatabase[]> => {
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .ilike('name', `%${searchTerm}%`)
      .order('name')
      .limit(10)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error searching exercises:', error)
    return []
  }
}

/**
 * Create a custom exercise
 */
export const createCustomExercise = async (exercise: Omit<ExerciseDatabase, 'id' | 'is_custom' | 'created_by'>): Promise<ExerciseDatabase | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No authenticated user')

    const { data, error } = await supabase
      .from('exercises')
      .insert({
        name: exercise.name,
        is_custom: true,
        created_by: user.id
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating custom exercise:', error)
    return null
  }
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Get workout statistics for the user
 */
export const getWorkoutStats = async (): Promise<{
  totalWorkouts: number
  totalTemplates: number
  workoutsThisWeek: number
  workoutsThisMonth: number
} | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Get total workouts
    const { count: totalWorkouts } = await supabase
      .from('workouts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // Get total templates
    const { count: totalTemplates } = await supabase
      .from('workout_templates')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // Get workouts this week
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const { count: workoutsThisWeek } = await supabase
      .from('workouts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('date', oneWeekAgo.toISOString())

    // Get workouts this month
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

    const { count: workoutsThisMonth } = await supabase
      .from('workouts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('date', oneMonthAgo.toISOString())

    return {
      totalWorkouts: totalWorkouts || 0,
      totalTemplates: totalTemplates || 0,
      workoutsThisWeek: workoutsThisWeek || 0,
      workoutsThisMonth: workoutsThisMonth || 0
    }
  } catch (error) {
    console.error('Error fetching workout stats:', error)
    return null
  }
}