'use client'

import { useState, useEffect } from 'react';
import { saveCompletedWorkout, getCompletedWorkoutsByDate } from '@/lib/api';
import type { CompletedWorkout, Exercise } from '@/types/workoutTypes';

// Custom hook for managing workout persistence
// Handles saving workouts and loading existing workouts by date
export function useWorkoutPersistence(targetDate: string, authReady: boolean) {
  const [existingWorkout, setExistingWorkout] = useState<CompletedWorkout | null>(null);
  const [isLoadingExistingWorkout, setIsLoadingExistingWorkout] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [forceReload, setForceReload] = useState(0);

  // Check for existing workout on the target date
  useEffect(() => {
    const checkForExistingWorkout = async () => {
      if (!targetDate || !authReady) return;

      setIsLoadingExistingWorkout(true);

      try {
        console.log('Checking for workouts on date:', targetDate);

        // Use the authenticated API function
        const workouts = await getCompletedWorkoutsByDate(targetDate);
        console.log('Found workouts for date:', targetDate, workouts);

        // If there's a workout for this date, show it
        if (workouts && workouts.length > 0) {
          const workout = workouts[0];
          console.log('Setting existing workout:', workout);
          setExistingWorkout({
            id: workout.id || Date.now().toString(),
            name: workout.name || 'Completed Workout',
            exercises: workout.exercises || [],
            notes: workout.notes,
            duration_minutes: workout.duration_minutes,
            date: workout.date || targetDate,
            created_at: workout.created_at
          });
        } else {
          console.log('No workouts found for date:', targetDate);
          setExistingWorkout(null);
        }
      } catch (error) {
        console.error('Error checking for existing workout:', error);
        setExistingWorkout(null);
      } finally {
        setIsLoadingExistingWorkout(false);
      }
    };

    // Always check for existing workout when date changes or force reload
    checkForExistingWorkout();
  }, [targetDate, authReady, forceReload]);

  // Save a completed workout
  const saveWorkout = async (
    workoutName: string,
    exercises: Exercise[],
    workoutNotes: string,
    startTime: Date | null
  ) => {
    if (!authReady) {
      throw new Error('Please wait for authentication to complete');
    }

    if (!workoutName.trim()) {
      throw new Error('Please enter a workout name');
    }

    const endTime = new Date();
    const duration = startTime ? Math.round((endTime.getTime() - startTime.getTime()) / 1000 / 60) : 0;

    setIsSaving(true);

    try {
      const workoutData = {
        name: workoutName,
        exercises,
        notes: workoutNotes,
        duration_minutes: duration,
        date: targetDate // Use the target date instead of today
      };

      console.log('Saving workout:', workoutData);
      const savedWorkout = await saveCompletedWorkout(workoutData);

      if (savedWorkout) {
        console.log('Workout saved:', savedWorkout);
        // Force reload of workout data for this date
        setForceReload(prev => prev + 1);
        return savedWorkout;
      } else {
        throw new Error('Failed to save workout');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Force reload existing workout data
  const reloadWorkout = () => {
    setForceReload(prev => prev + 1);
  };

  return {
    existingWorkout,
    isLoadingExistingWorkout,
    isSaving,
    saveWorkout,
    reloadWorkout,
    clearExistingWorkout: () => setExistingWorkout(null)
  };
}