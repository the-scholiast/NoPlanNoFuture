import { apiCall } from '../api/client'
import { transformCompletedWorkout } from '../utils/transformers'
import {
  CompletedWorkout,
  SaveCompletedWorkoutRequest,
  UpdateCompletedWorkoutRequest
} from '@/types/workoutTypes'

// Get user's completed workouts with optional limit
export async function getCompletedWorkouts(limit?: number): Promise<CompletedWorkout[]> {
  try {
    const url = limit ? `/workouts?limit=${limit}` : '/workouts'
    const data = await apiCall(url)
    return Array.isArray(data) ? data.map(transformCompletedWorkout) : []
  } catch (error) {
    console.error('Error fetching completed workouts:', error)
    return []
  }
}

// Save a completed workout
export async function saveCompletedWorkout(
  workout: SaveCompletedWorkoutRequest
): Promise<CompletedWorkout | null> {
  try {
    const data = await apiCall('/workouts', {
      method: 'POST',
      body: JSON.stringify(workout)
    })
    return transformCompletedWorkout(data)
  } catch (error) {
    console.error('Error saving completed workout:', error)
    return null
  }
}

// Update a completed workout
export async function updateCompletedWorkout(
  id: string,
  updates: UpdateCompletedWorkoutRequest
): Promise<CompletedWorkout | null> {
  try {
    const data = await apiCall(`/workouts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    })
    return transformCompletedWorkout(data)
  } catch (error) {
    console.error('Error updating completed workout:', error)
    return null
  }
}

// Delete a completed workout
export async function deleteCompletedWorkout(id: string): Promise<boolean> {
  try {
    await apiCall(`/workouts/${id}`, {
      method: 'DELETE'
    })
    return true
  } catch (error) {
    console.error('Error deleting completed workout:', error)
    return false
  }
}

// Get a specific completed workout by ID
export async function getCompletedWorkout(id: string): Promise<CompletedWorkout | null> {
  try {
    const data = await apiCall(`/workouts/${id}`)
    return transformCompletedWorkout(data)
  } catch (error) {
    console.error('Error fetching completed workout:', error)
    return null
  }
}

// Get completed workouts for a specific date
export async function getCompletedWorkoutsByDate(date: string): Promise<CompletedWorkout[]> {
  try {
    const data = await apiCall(`/workouts?date=${date}`)
    return Array.isArray(data) ? data.map(transformCompletedWorkout) : []
  } catch (error) {
    console.error('Error fetching workouts by date:', error)
    return []
  }
}