'use client'

import { useState } from 'react';
import type { Exercise, Set } from '@/app/types/workout';

// Custom hook for managing workout state
// Handles exercises, sets, and workout completion logic
export function useWorkoutState() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [workoutName, setWorkoutName] = useState("");
  const [workoutNotes, setWorkoutNotes] = useState("");
  const [workoutDuration, setWorkoutDuration] = useState<number>(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isWorkoutCompleted, setIsWorkoutCompleted] = useState(false);

  // Add a new exercise to the workout
  const addExercise = (exerciseName: string) => {
    const newExercise: Exercise = {
      id: Date.now().toString(),
      name: exerciseName,
      sets: [
        { id: Date.now().toString(), weight: 0, reps: 0, completed: false }
      ]
    };
    setExercises(prev => [...prev, newExercise]);
    
    // Start the timer if this is the first exercise
    if (!startTime) {
      setStartTime(new Date());
    }
  };

  // Remove an exercise from the workout
  const removeExercise = (exerciseId: string) => {
    setExercises(prev => prev.filter(ex => ex.id !== exerciseId));
  };

  // Add a new set to an exercise
  const addSet = (exerciseId: string) => {
    setExercises(prev => prev.map(exercise => {
      if (exercise.id === exerciseId) {
        const lastSet = exercise.sets[exercise.sets.length - 1];
        const newSet: Set = {
          id: Date.now().toString(),
          weight: lastSet ? lastSet.weight : 0,
          reps: lastSet ? lastSet.reps : 0,
          completed: false
        };
        return {
          ...exercise,
          sets: [...exercise.sets, newSet]
        };
      }
      return exercise;
    }));
  };

  // Remove a set from an exercise
  const removeSet = (exerciseId: string, setId: string) => {
    setExercises(prev => prev.map(exercise => {
      if (exercise.id === exerciseId) {
        return {
          ...exercise,
          sets: exercise.sets.filter(set => set.id !== setId)
        };
      }
      return exercise;
    }));
  };

  // Update a specific set's properties
  const updateSet = (exerciseId: string, setId: string, field: 'weight' | 'reps' | 'completed', value: number | boolean) => {
    setExercises(prev => prev.map(exercise => {
      if (exercise.id === exerciseId) {
        return {
          ...exercise,
          sets: exercise.sets.map(set => {
            if (set.id === setId) {
              return { ...set, [field]: value };
            }
            return set;
          })
        };
      }
      return exercise;
    }));
  };

  // Load a template into the current workout
  const loadTemplate = (template: any) => {
    if (!template) return;

    // Create new exercises with default sets
    const newExercises: Exercise[] = template.exercises.map((exerciseName: string, index: number) => ({
      id: `${Date.now()}-${index}`,
      name: exerciseName,
      sets: [
        { id: `${Date.now()}-${index}-1`, weight: 0, reps: 0, completed: false }
      ]
    }));

    setExercises(newExercises);
    setWorkoutName(template.name);
    setStartTime(new Date());
    setIsWorkoutCompleted(false);
  };

  // Reset workout to initial state
  const resetWorkout = () => {
    setExercises([]);
    setWorkoutName("");
    setWorkoutNotes("");
    setWorkoutDuration(0);
    setStartTime(new Date());
    setIsWorkoutCompleted(false);
  };

  return {
    // State
    exercises,
    workoutName,
    workoutNotes,
    workoutDuration,
    startTime,
    isWorkoutCompleted,
    
    // Setters
    setExercises,
    setWorkoutName,
    setWorkoutNotes,
    setWorkoutDuration,
    setStartTime,
    setIsWorkoutCompleted,
    
    // Actions
    addExercise,
    removeExercise,
    addSet,
    removeSet,
    updateSet,
    loadTemplate,
    resetWorkout
  };
}