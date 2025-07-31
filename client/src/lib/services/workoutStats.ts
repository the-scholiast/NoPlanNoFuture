import { apiCall } from '../api/client'

export interface WorkoutStats {
  totalWorkouts: number
  totalSets: number
  totalReps: number
  totalWeight: number
  averageDuration: number
  streakDays: number
  favoriteExercises: string[]
}

// Get workout statistics for the user
export async function getWorkoutStats(): Promise<WorkoutStats | null> {
  try {
    const data = await apiCall('/stats')
    return data
  } catch (error) {
    console.error('Error fetching workout stats:', error)
    return null
  }
}