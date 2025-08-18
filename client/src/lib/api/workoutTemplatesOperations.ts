import { apiCall } from './client'
import { transformWorkoutTemplate } from '../utils/transformers'
import { WorkoutTemplate, CreateWorkoutTemplateRequest, UpdateWorkoutTemplateRequest } from '@/types/workoutTypes'

// Get all workout templates for the authenticated user
export async function getWorkoutTemplates(): Promise<WorkoutTemplate[]> {
  try {
    const data = await apiCall('/workout-templates')
    return Array.isArray(data) ? data.map(transformWorkoutTemplate) : []
  } catch (error) {
    console.error('Error fetching workout templates:', error)
    return []
  }
}

// Create a new workout template
export async function createWorkoutTemplate(
  template: CreateWorkoutTemplateRequest
): Promise<WorkoutTemplate | null> {
  try {
    const data = await apiCall('/workout-templates', {
      method: 'POST',
      body: JSON.stringify(template)
    })
    return transformWorkoutTemplate(data)
  } catch (error) {
    console.error('Error creating workout template:', error)
    return null
  }
}

// Update an existing workout template
export async function updateWorkoutTemplate(
  id: string,
  updates: UpdateWorkoutTemplateRequest
): Promise<WorkoutTemplate | null> {
  try {
    const data = await apiCall(`/workout-templates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    })
    return transformWorkoutTemplate(data)
  } catch (error) {
    console.error('Error updating workout template:', error)
    return null
  }
}

// Delete a workout template
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