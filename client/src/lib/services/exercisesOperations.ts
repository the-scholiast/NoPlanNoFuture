import { apiCall } from '../api/client'
import { transformExerciseDatabase } from '../utils/transformers'
import {
  ExerciseDatabase,
  CreateCustomExerciseRequest
} from '@/types/workoutTypes'

// Get all exercises from the database
export async function getExerciseDatabase(): Promise<ExerciseDatabase[]> {
  try {
    const data = await apiCall('/exercises')
    return Array.isArray(data) ? data.map(transformExerciseDatabase) : []
  } catch (error) {
    console.error('Error fetching exercise database:', error)
    return []
  }
}

// Search exercises by name
export async function searchExercises(searchTerm: string): Promise<ExerciseDatabase[]> {
  try {
    const data = await apiCall(`/exercises/search?q=${encodeURIComponent(searchTerm)}`)
    return Array.isArray(data) ? data.map(transformExerciseDatabase) : []
  } catch (error) {
    console.error('Error searching exercises:', error)
    return []
  }
}

// Create a custom exercise
export async function createCustomExercise(
  request: CreateCustomExerciseRequest
): Promise<ExerciseDatabase | null> {
  try {
    const data = await apiCall('/exercises', {
      method: 'POST',
      body: JSON.stringify(request)
    })
    return transformExerciseDatabase(data)
  } catch (error) {
    console.error('Error creating custom exercise:', error)
    return null
  }
}