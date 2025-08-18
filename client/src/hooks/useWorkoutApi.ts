import { useState, useEffect } from 'react'
import { WorkoutTemplate, CompletedWorkout } from '@/types/workoutTypes'
import {
  getWorkoutTemplates,
  createWorkoutTemplate as createTemplate,
  updateWorkoutTemplate as updateTemplate,
  deleteWorkoutTemplate as deleteTemplate,
  getCompletedWorkouts,
  saveCompletedWorkout as saveWorkout
} from '../lib/api/'

export function useWorkoutApi() {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [workouts, setWorkouts] = useState<CompletedWorkout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getWorkoutTemplates()
      setTemplates(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentWorkouts = async (limit = 10) => {
    try {
      const data = await getCompletedWorkouts(limit)
      setWorkouts(data)
    } catch (err) {
      console.error('Error fetching recent workouts:', err)
    }
  }

  const createWorkoutTemplate = async (template: { name: string; exercises: string[]; is_public?: boolean }) => {
    try {
      const newTemplate = await createTemplate(template)
      if (newTemplate) {
        setTemplates(prev => [...prev, newTemplate])
      }
      return newTemplate
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create template')
      return null
    }
  }

  const updateWorkoutTemplate = async (id: string, updates: Partial<WorkoutTemplate>) => {
    try {
      const updatedTemplate = await updateTemplate(id, updates)
      if (updatedTemplate) {
        setTemplates(prev => prev.map(t => t.id === id ? updatedTemplate : t))
      }
      return updatedTemplate
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update template')
      return null
    }
  }

  const deleteWorkoutTemplate = async (id: string) => {
    try {
      const success = await deleteTemplate(id)
      if (success) {
        setTemplates(prev => prev.filter(t => t.id !== id))
      }
      return success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template')
      return false
    }
  }

  const saveCompletedWorkout = async (workout: Parameters<typeof saveWorkout>[0]) => {
    try {
      const savedWorkout = await saveWorkout(workout)
      if (savedWorkout) {
        setWorkouts(prev => [savedWorkout, ...prev])
      }
      return savedWorkout
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save workout')
      return null
    }
  }

  useEffect(() => {
    fetchTemplates()
    fetchRecentWorkouts()
  }, [])

  return {
    templates,
    workouts,
    loading,
    error,
    refetch: fetchTemplates,
    refreshWorkouts: fetchRecentWorkouts,
    createWorkoutTemplate,
    updateWorkoutTemplate,
    deleteWorkoutTemplate,
    saveCompletedWorkout
  }
}