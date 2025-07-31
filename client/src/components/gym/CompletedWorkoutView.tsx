"use client"

import React from 'react';
import { ArrowLeft, Calendar, Clock, Dumbbell, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import type { CompletedWorkoutViewProps } from '@/app/types/workout'; 

// Displays a completed workout with all its details including:
// - Workout summary (name, date, duration, exercise count)
// - Detailed exercise breakdown with sets and reps
// - Workout notes if available
// - Action buttons for navigation and starting new workouts
export default function CompletedWorkoutView({
  workout,
  onStartNewWorkout,
  router,
  className = ""
}: CompletedWorkoutViewProps) {

  // Formats a date string into a readable format
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Formats duration from minutes to readable format
  const formatDuration = (minutes?: number): string => {
    if (!minutes) return 'N/A';

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${remainingMinutes}m`;
  };

  // Calculates the completion percentage for an exercise
  const getSetCompletionStats = (sets: any[]) => {
    if (!sets || sets.length === 0) {
      return { completed: 0, total: 0, percentage: 0 };
    }

    const completed = sets.filter(set => set.completed).length;
    const total = sets.length;
    const percentage = Math.round((completed / total) * 100);

    return { completed, total, percentage };
  };

  return (
    <div className={`max-w-4xl mx-auto p-6 space-y-6 ${className}`}>
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Back Navigation Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/gym/workout')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Workout
          </Button>

          {/* Success Title */}
          <div>
            <h1 className="text-3xl font-bold text-green-600">
              Workout Completed! 
            </h1>
          </div>
        </div>

        {/* Start New Workout Button */}
        <Button
          onClick={onStartNewWorkout}
          className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
        >
          <Dumbbell className="h-4 w-4" />
          Start New Workout
        </Button>
      </div>

      {/* Workout Summary Card */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Dumbbell className="h-5 w-5 text-blue-600" />
            {workout.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Summary Statistics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Workout Date */}
            <div className="flex items-center gap-2 p-3 bg-background rounded-lg">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <span className="text-sm font-medium text-gray-600">Date:</span>
                <p className="text-sm font-semibold">{formatDate(workout.date)}</p>
              </div>
            </div>

            {/* Workout Duration */}
            <div className="flex items-center gap-2 p-3 bg-background rounded-lg">
              <Clock className="h-4 w-4 text-gray-500" />
              <div>
                <span className="text-sm font-medium text-gray-600">Duration:</span>
                <p className="text-sm font-semibold">{formatDuration(workout.duration_minutes)}</p>
              </div>
            </div>

            {/* Exercise Count */}
            <div className="flex items-center gap-2 p-3 bg-background rounded-lg">
              <Dumbbell className="h-4 w-4 text-gray-500" />
              <div>
                <span className="text-sm font-medium text-gray-600">Exercises:</span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-semibold">
                    {workout.exercises.length}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exercise Details Card */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Exercise Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {workout.exercises.map((exercise, exerciseIndex) => {
            const completionStats = getSetCompletionStats(exercise.sets);

            return (
              <div
                key={exerciseIndex}
                className="border rounded-lg p-4 bg-background"
              >
                {/* Exercise Header */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg">
                    {exercise.name}
                  </h3>

                  {/* Completion Badge */}
                  <Badge
                    variant={completionStats.percentage === 100 ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {completionStats.completed}/{completionStats.total} sets completed
                  </Badge>
                </div>

                {/* Sets Table */}
                {exercise.sets && exercise.sets.length > 0 ? (
                  <div className="space-y-2">
                    {/* Table Header */}
                    <div className="grid grid-cols-3 gap-4 text-sm font-medium text-gray-600 border-b pb-2">
                      <span>Set</span>
                      <span>Weight (lbs)</span>
                      <span>Reps</span>
                    </div>

                    {/* Table Rows */}
                    {exercise.sets.map((set: any, setIndex: number) => (
                      <div
                        key={setIndex}
                        className={`grid grid-cols-3 gap-4 text-sm py-2 px-1 rounded transition-colors ${set.completed
                            ? 'text-green-600 font-medium bg-green-50'
                            : 'text-gray-400 bg-gray-50'
                          }`}
                      >
                        <span className="font-semibold">#{setIndex + 1}</span>
                        <span>{set.weight || 0}</span>
                        <span>{set.reps || 0}</span>
                      </div>
                    ))}

                    {/* Completion Summary */}
                    <div className="text-xs text-gray-500 mt-3 p-2 bg-gray-50 rounded">
                      <strong>{completionStats.percentage}%</strong> completion rate
                      ({completionStats.completed} of {completionStats.total} sets completed)
                    </div>
                  </div>
                ) : (
                  /* No Sets Recorded State */
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">No sets recorded for this exercise</p>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Workout Notes Card (Conditional) */}
      {workout.notes && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <FileText className="h-5 w-5 text-gray-600" />
              Workout Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {workout.notes}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons Footer */}
      <div className="flex gap-4 justify-center pt-4">
        <Button
          variant="outline"
          onClick={() => router.push('/gym/workouts')} // Create route
          className="flex items-center gap-2"
        >
          <FileText className="h-4 w-4" />
          View All Workouts
        </Button>

        <Button
          onClick={onStartNewWorkout}
          className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
        >
          <Dumbbell className="h-4 w-4" />
          Start New Workout
        </Button>
      </div>
    </div>
  );
}