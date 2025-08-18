import { apiCall } from './client'

export interface WorkoutStats {
  totalWorkouts: number
  totalSets: number
  totalReps: number
  totalWeight: number
  averageDuration: number
  streakDays: number
  favoriteExercises: string[]
}

export interface SimpleWorkoutStats {
  totalWorkouts: number
  totalTemplates: number
  workoutsThisWeek: number
  workoutsThisMonth: number
}

// Get detailed workout statistics for the user
export async function getWorkoutStats(): Promise<WorkoutStats | null> {
  try {
    const data = await apiCall('/stats')
    return data
  } catch (error) {
    console.error('Error fetching workout stats:', error)
    return null
  }
}

// Get simple workout statistics for dashboard
export async function getSimpleWorkoutStats(): Promise<SimpleWorkoutStats | null> {
  try {
    const data = await apiCall('/stats/simple')
    return data
  } catch (error) {
    console.error('Error fetching simple workout stats:', error)
    return null
  }
}