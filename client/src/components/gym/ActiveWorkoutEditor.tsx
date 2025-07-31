// Handles the workout creation and editing interface including:
// - Workout details form (name, template selection, duration)
// - Exercise management (add, remove, edit exercises)
// - Set tracking (add, remove, update sets)
// - Workout notes and completion actions
"use client"

import React from 'react';
import { Plus, Check, Save, Clock, StickyNote, RefreshCw, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Textarea } from '../ui/textarea';
import ExerciseInput from './ExerciseInput';
import type { ActiveWorkoutEditorProps } from '@/types/workoutTypes';

// This component manages the active workout state and provides a complete interface for tracking workout progress
export default function ActiveWorkoutEditor({
  workoutName,
  onWorkoutNameChange,
  workoutNotes,
  onWorkoutNotesChange,
  workoutDuration,
  onWorkoutDurationChange,
  exercises,
  onExercisesChange,
  templates,
  selectedTemplate,
  onTemplateSelect,
  isRefreshingTemplates,
  onRefreshTemplates,
  templatesLoaded,
  isWorkoutCompleted,
  authReady,
  isSaving,
  startTime,
  onCompleteWorkout,
  onSaveAsTemplate,
  onStartNewWorkout,
  className = ""
}: ActiveWorkoutEditorProps) {

  // Add a new exercise to the workout
  const handleExerciseAdd = (exerciseName: string) => {
    const newExercise = {
      id: Date.now().toString(),
      name: exerciseName,
      sets: [
        { id: Date.now().toString(), weight: 0, reps: 0, completed: false }
      ]
    };
    onExercisesChange([...exercises, newExercise]);
  };

  // Remove an exercise from the workout
  const removeExercise = (exerciseId: string) => {
    onExercisesChange(exercises.filter(ex => ex.id !== exerciseId));
  };

  // Add a new set to an exercise
  const addSet = (exerciseId: string) => {
    onExercisesChange(exercises.map(exercise => {
      if (exercise.id === exerciseId) {
        const lastSet = exercise.sets[exercise.sets.length - 1];
        const newSet = {
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
    onExercisesChange(exercises.map(exercise => {
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
    onExercisesChange(exercises.map(exercise => {
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

  return (
    <div className={`max-w-6xl mx-auto p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">
            Workout Tracker
          </h2>
          {startTime && !isWorkoutCompleted && (
            <p className="text-sm text-gray-600">
              Started: {startTime.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {!isWorkoutCompleted ? (
            <>
              {/* Complete Workout Button */}
              <Button
                onClick={onCompleteWorkout}
                disabled={isSaving || !authReady}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : !authReady ? (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    Waiting for Auth...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Complete Workout
                  </>
                )}
              </Button>

              {/* Save as Template Button */}
              <Button
                onClick={onSaveAsTemplate}
                variant="outline"
                disabled={isSaving || !authReady}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
                    Saving Template...
                  </>
                ) : !authReady ? (
                  'Waiting for Auth...'
                ) : (
                  'Save as Template'
                )}
              </Button>
            </>
          ) : (
            /* Start New Workout Button */
            <Button onClick={onStartNewWorkout} className="bg-blue-600 hover:bg-blue-700">
              Start New Workout
            </Button>
          )}
        </div>
      </div>

      {/* Workout Details Form */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Workout Name Input */}
        <div>
          <label className="block text-sm font-medium mb-1">Workout Name</label>
          <Input
            value={workoutName}
            onChange={(e) => onWorkoutNameChange(e.target.value)}
            placeholder="Enter workout name"
            disabled={isWorkoutCompleted}
          />
        </div>

        {/* Template Selection */}
        <div>
          <label className="block text-sm font-medium mb-1">Load Template</label>
          <div className="flex gap-2">
            <Select value={selectedTemplate} onValueChange={onTemplateSelect} disabled={isWorkoutCompleted}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={
                  !templatesLoaded ? "Loading templates..." :
                    templates.length === 0 ? "No templates available" :
                      "Choose a template"
                } />
              </SelectTrigger>
              <SelectContent>
                {templates.length > 0 ? (
                  templates.map((template) => (
                    <SelectItem key={template.name} value={template.name}>
                      {template.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-templates" disabled>
                    No templates found - create one by saving a workout!
                  </SelectItem>
                )}
              </SelectContent>
            </Select>

            {/* Refresh Templates Button */}
            <Button
              onClick={onRefreshTemplates}
              disabled={isRefreshingTemplates || isWorkoutCompleted || !authReady}
              variant="outline"
              size="sm"
            >
              {isRefreshingTemplates ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Duration Input */}
        <div>
          <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
          <Input
            type="number"
            value={workoutDuration}
            onChange={(e) => onWorkoutDurationChange(Number(e.target.value))}
            placeholder="0"
            disabled={isWorkoutCompleted}
          />
        </div>
      </div>

      {/* Workout Notes Section */}
      <div>
        <label className="text-sm font-medium mb-1 flex items-center gap-2">
          <StickyNote className="h-4 w-4" />
          Workout Notes
        </label>
        <Textarea
          value={workoutNotes}
          onChange={(e) => onWorkoutNotesChange(e.target.value)}
          placeholder="How did the workout go? Any observations?"
          disabled={isWorkoutCompleted}
          rows={3}
        />
      </div>

      {/* Add Exercise Section */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Add Exercise</h3>
        <ExerciseInput
          onExerciseAdd={handleExerciseAdd}
          disabled={isWorkoutCompleted}
        />
      </div>

      {/* Exercise List */}
      {exercises.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Exercises</h3>
          {exercises.map((exercise) => (
            <div key={exercise.id} className="border rounded-lg p-4 space-y-4">
              {/* Exercise Header */}
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-medium">{exercise.name}</h4>
                {!isWorkoutCompleted && (
                  <Button
                    onClick={() => removeExercise(exercise.id)}
                    variant="outline"
                    size="sm"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Sets Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Set</TableHead>
                    <TableHead>Weight (lbs)</TableHead>
                    <TableHead>Reps</TableHead>
                    <TableHead>Done</TableHead>
                    {!isWorkoutCompleted && <TableHead>Action</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exercise.sets.map((set, index) => (
                    <TableRow key={set.id}>
                      {/* Set Number */}
                      <TableCell>{index + 1}</TableCell>

                      {/* Weight Input */}
                      <TableCell>
                        <Input
                          type="number"
                          value={set.weight}
                          onChange={(e) => updateSet(exercise.id, set.id, 'weight', Number(e.target.value))}
                          className="w-20"
                          disabled={isWorkoutCompleted}
                        />
                      </TableCell>

                      {/* Reps Input */}
                      <TableCell>
                        <Input
                          type="number"
                          value={set.reps}
                          onChange={(e) => updateSet(exercise.id, set.id, 'reps', Number(e.target.value))}
                          className="w-20"
                          disabled={isWorkoutCompleted}
                        />
                      </TableCell>

                      {/* Completion Toggle */}
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <Button
                            onClick={() => updateSet(exercise.id, set.id, 'completed', !set.completed)}
                            variant={set.completed ? "default" : "outline"}
                            size="sm"
                            disabled={isWorkoutCompleted}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>

                      {/* Remove Set Button */}
                      {!isWorkoutCompleted && (
                        <TableCell>
                          <Button
                            onClick={() => removeSet(exercise.id, set.id)}
                            variant="outline"
                            size="sm"
                            disabled={exercise.sets.length <= 1}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Add Set Button */}
              {!isWorkoutCompleted && (
                <Button
                  onClick={() => addSet(exercise.id)}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Set
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {exercises.length === 0 && templatesLoaded && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Start Your Workout</h3>
          <p className="text-gray-500 mb-4">
            {templates.length === 0
              ? "Add exercises to begin your workout, then save as a template for future use."
              : "Load a template above or add exercises manually to get started."
            }
          </p>
        </div>
      )}
    </div>
  );
}