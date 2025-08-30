'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getUserProfile,
  updateUserProfile,
  getWorkoutTemplates,
  createWorkoutTemplate,
  updateWorkoutTemplate,
  deleteWorkoutTemplate,
  getCompletedWorkouts,
  saveCompletedWorkout,
  updateCompletedWorkout,
  deleteCompletedWorkout,
  getExerciseDatabase,
  searchExercises,
  createCustomExercise,
  getSimpleWorkoutStats,
  type UserProfile,
} from '@/lib/api'
import { type WorkoutTemplate, type CompletedWorkout, type ExerciseDatabase } from '@/types/workoutTypes'
import { useAuth } from './useAuth'

// =============================================
// EXERCISE DATABASE HOOK
// =============================================

export function useExercises() {
  const [exercises, setExercises] = useState<ExerciseDatabase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadExercises = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getExerciseDatabase()
      setExercises(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exercises')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadExercises()
  }, [loadExercises])

  const searchExercisesByName = async (searchTerm: string) => {
    try {
      setError(null)
      const data = await searchExercises(searchTerm)
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search exercises')
      return []
    }
  }

  const createExercise = async (exercise: Omit<ExerciseDatabase, 'id' | 'is_custom' | 'created_by'>) => {
    try {
      setError(null)
      const created = await createCustomExercise(exercise)
      if (created) {
        setExercises((prev: ExerciseDatabase[]) => [...prev, created])
      }
      return created
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create exercise')
      return null
    }
  }

  return {
    exercises,
    loading,
    error,
    searchExercises: searchExercisesByName,
    createExercise,
    refetch: loadExercises
  }
}

// =============================================
// WORKOUT STATS HOOK
// =============================================

export function useWorkoutStats() {
  const { user } = useAuth()
  const [stats, setStats] = useState<{
    totalWorkouts: number
    totalTemplates: number
    workoutsThisWeek: number
    workoutsThisMonth: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadStats()
    } else {
      setStats(null)
      setLoading(false)
    }
  }, [user])

  const loadStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getSimpleWorkoutStats() // Use the simple stats function
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats')
    } finally {
      setLoading(false)
    }
  }

  return {
    stats,
    loading,
    error,
    refetch: loadStats
  }
}

// =============================================
// USER PROFILE HOOK
// =============================================

export function useUserProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadProfile()
    } else {
      setProfile(null)
      setLoading(false)
    }
  }, [user])

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getUserProfile()
      setProfile(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      setError(null)
      const updated = await updateUserProfile(updates)
      if (updated) {
        setProfile(updated)
      }
      return updated
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
      return null
    }
  }

  return {
    profile,
    loading,
    error,
    updateProfile,
    refetch: loadProfile
  }
}

// =============================================
// WORKOUT TEMPLATES HOOK 
// =============================================

export function useWorkoutTemplatesAlt() {
  const { user } = useAuth()
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadTemplates()
    } else {
      setTemplates([])
      setLoading(false)
    }
  }, [user])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getWorkoutTemplates()
      setTemplates(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates')
    } finally {
      setLoading(false)
    }
  }

  const createTemplate = async (template: Omit<WorkoutTemplate, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    try {
      setError(null)
      const created = await createWorkoutTemplate(template)
      if (created) {
        setTemplates((prev: WorkoutTemplate[]) => [created, ...prev])
      }
      return created
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create template')
      return null
    }
  }

  const updateTemplate = async (id: string, updates: Partial<WorkoutTemplate>) => {
    try {
      setError(null)
      const updated = await updateWorkoutTemplate(id, updates)
      if (updated) {
        setTemplates((prev: WorkoutTemplate[]) => prev.map(t => t.id === id ? updated : t))
      }
      return updated
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update template')
      return null
    }
  }

  const deleteTemplate = async (id: string) => {
    try {
      setError(null)
      const success = await deleteWorkoutTemplate(id)
      if (success) {
        setTemplates((prev: WorkoutTemplate[]) => prev.filter(t => t.id !== id))
      }
      return success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete template')
      return false
    }
  }

  return {
    templates,
    loading,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    refetch: loadTemplates
  }
}

// =============================================
// COMPLETED WORKOUTS HOOK
// =============================================

export function useCompletedWorkouts(limit?: number) {
  const { user } = useAuth()
  const [workouts, setWorkouts] = useState<CompletedWorkout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)


  const loadWorkouts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getCompletedWorkouts(limit)
      setWorkouts(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load workouts')
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    if (user) {
      loadWorkouts()
    } else {
      setWorkouts([])
      setLoading(false)
    }
  }, [user, limit, loadWorkouts])

  const saveWorkout = async (workout: Omit<CompletedWorkout, 'id' | 'user_id' | 'created_at'>) => {
    try {
      setError(null)
      const saved = await saveCompletedWorkout(workout)
      if (saved) {
        setWorkouts((prev: CompletedWorkout[]) => [saved, ...prev])
      }
      return saved
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save workout')
      return null
    }
  }

  const updateWorkout = async (id: string, updates: Partial<CompletedWorkout>) => {
    try {
      setError(null)
      const updated = await updateCompletedWorkout(id, updates)
      if (updated) {
        setWorkouts((prev: CompletedWorkout[]) => prev.map(w => w.id === id ? updated : w))
      }
      return updated
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update workout')
      return null
    }
  }

  const deleteWorkout = async (id: string) => {
    try {
      setError(null)
      const success = await deleteCompletedWorkout(id)
      if (success) {
        setWorkouts((prev: CompletedWorkout[]) => prev.filter(w => w.id !== id))
      }
      return success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete workout')
      return false
    }
  }

  return {
    workouts,
    loading,
    error,
    saveWorkout,
    updateWorkout,
    deleteWorkout,
    refetch: loadWorkouts
  }
}