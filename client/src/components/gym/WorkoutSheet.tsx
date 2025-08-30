"use client"

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useWorkoutAuth } from '@/hooks/useWorkoutAuth';
import { useWorkoutTemplates } from '@/hooks/useWorkoutTemplates';
import { useWorkoutState } from '@/hooks/useWorkoutState';
import { useWorkoutPersistence } from '@/hooks/useWorkoutPersistence';
import CompletedWorkoutView from './CompletedWorkoutView';
import ActiveWorkoutEditor from './ActiveWorkoutEditor';
import LoadingSpinner from '../ui/LoadingSpinner';
import type { WorkoutSheetProps } from '@/types/workoutTypes';
import { getTodayString } from '@/lib/utils/dateUtils';

// Main container component that orchestrates the workout tracking experience
function WorkoutSheetContent({ className }: WorkoutSheetProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Date management - get target date from URL parameters
  const [targetDate, setTargetDate] = useState<string>('');

  // Get target date from URL parameters
  useEffect(() => {
    const year = searchParams.get('year');
    const month = searchParams.get('month');
    const day = searchParams.get('day');

    let dateString: string;

    if (year && month && day) {
      // Use specific date from URL
      dateString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    } else {
      // Use today's date
      dateString = getTodayString();
    }

    setTargetDate(dateString);
  }, [searchParams]);

  // Authentication state
  const { authReady } = useWorkoutAuth();

  // Template management
  const {
    templates,
    selectedTemplate,
    setSelectedTemplate,
    isRefreshingTemplates,
    templatesLoaded,
    refreshTemplates,
    saveAsTemplate
  } = useWorkoutTemplates(authReady);

  // Workout state management
  const {
    exercises,
    workoutName,
    workoutNotes,
    workoutDuration,
    startTime,
    isWorkoutCompleted,
    setExercises,
    setWorkoutName,
    setWorkoutNotes,
    setWorkoutDuration,
    loadTemplate,
    resetWorkout
  } = useWorkoutState();

  // Workout persistence (save/load)
  const {
    existingWorkout,
    isLoadingExistingWorkout,
    isSaving,
    saveWorkout,
    clearExistingWorkout
  } = useWorkoutPersistence(targetDate, authReady);

  // Handle template selection
  const handleTemplateSelect = (templateName: string) => {
    setSelectedTemplate(templateName);
    const template = templates.find(t => t.name === templateName);
    if (template) {
      loadTemplate(template);
    }
  };

  // Handle workout completion
  const handleCompleteWorkout = async () => {
    try {
      await saveWorkout(workoutName, exercises, workoutNotes, startTime);
      alert(`Workout "${workoutName}" completed and saved!`);
    } catch (error) {
      console.error('Error saving workout:', error);
      alert(`Failed to save workout: ${error}`);
    }
  };

  // Handle saving workout as template
  const handleSaveAsTemplate = async () => {
    try {
      await saveAsTemplate(workoutName, exercises);
      alert(`Template "${workoutName} Template" saved successfully!`);
    } catch (error) {
      console.error('Error saving template:', error);
      alert(`Failed to save template: ${error}`);
    }
  };

  // Handle starting a new workout
  const handleStartNewWorkout = () => {
    resetWorkout();
    setSelectedTemplate("");
    // Clear existing workout to show the workout creation interface
    clearExistingWorkout();
  };

  // Show loading state while checking for existing workout
  if (isLoadingExistingWorkout) {
    return (
      <div className="min-h-screen">
        <LoadingSpinner
          size="lg"
          centered
          text="Loading workout data..."
          className="min-h-screen"
        />
      </div>
    );
  }

  // If there's an existing workout for this date, show the completed workout view
  if (existingWorkout) {
    return (
      <CompletedWorkoutView
        workout={existingWorkout}
        onStartNewWorkout={handleStartNewWorkout}
        router={router}
        className={className}
      />
    );
  }

  // Otherwise, show the active workout editor
  return (
    <ActiveWorkoutEditor
      workoutName={workoutName}
      onWorkoutNameChange={setWorkoutName}
      workoutNotes={workoutNotes}
      onWorkoutNotesChange={setWorkoutNotes}
      workoutDuration={workoutDuration}
      onWorkoutDurationChange={setWorkoutDuration}
      exercises={exercises}
      onExercisesChange={setExercises}
      templates={templates}
      selectedTemplate={selectedTemplate}
      onTemplateSelect={handleTemplateSelect}
      isRefreshingTemplates={isRefreshingTemplates}
      onRefreshTemplates={refreshTemplates}
      templatesLoaded={templatesLoaded}
      isWorkoutCompleted={isWorkoutCompleted}
      authReady={authReady}
      isSaving={isSaving}
      startTime={startTime}
      onCompleteWorkout={handleCompleteWorkout}
      onSaveAsTemplate={handleSaveAsTemplate}
      onStartNewWorkout={handleStartNewWorkout}
      className={className}
    />
  );
}

function WorkoutSheetFallback() {
  return (
    <div className="min-h-screen">
      <LoadingSpinner
        size="lg"
        centered
        text="Loading workout..."
        className="min-h-screen"
      />
    </div>
  );
}

export default function WorkoutSheet(props: WorkoutSheetProps) {
  return (
    <Suspense fallback={<WorkoutSheetFallback/>}>
      <WorkoutSheetContent {...props} />
    </Suspense>
  );
}