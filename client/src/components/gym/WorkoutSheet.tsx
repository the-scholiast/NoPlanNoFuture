"use client"

import React, { useState, useEffect } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

// ===== TYPE DEFINITIONS =====
interface Exercise {
  id: string;
  name: string;
  sets: Set[];
}

interface Set {
  id: string;
  weight: number;
  reps: number;
}

interface WorkoutTemplate {
  name: string;
  exercises: string[];
}

interface WorkoutSheetProps {
  initialTemplates: WorkoutTemplate[];  // Available workout templates from database/API
  exerciseDatabase: string[];           // Complete list of exercises for autocomplete
  className?: string;                   // Optional CSS classes for styling
}

export default function WorkoutSheet({
  initialTemplates,
  exerciseDatabase,
  className
}: WorkoutSheetProps) {
  // ===== STATE MANAGEMENT =====

  // Currently selected workout template name. Defaults to first available template or empty string
  const [selectedTemplate, setSelectedTemplate] = useState(initialTemplates.length > 0 ? initialTemplates[0].name : "");
  // Current workout exercises with their sets
  const [exercises, setExercises] = useState<Exercise[]>([]);
  // Input value for adding new exercises
  const [newExerciseName, setNewExerciseName] = useState("");
  // Autocomplete suggestions shown to user while typing. Filtered from exerciseDatabase based on input
  const [exerciseSuggestions, setExerciseSuggestions] = useState<string[]>([]);

  // ===== TEMPLATE MANAGEMENT =====
  const loadTemplate = (templateName: string) => {
    setSelectedTemplate(templateName);

    const template = initialTemplates.find(t => t.name === templateName);
    if (!template) return;

    // Create new exercises with default sets
    const newExercises: Exercise[] = template.exercises.map((exerciseName, index) => ({
      id: `${Date.now()}-${index}`,
      name: exerciseName,
      sets: [
        { id: `${Date.now()}-${index}-1`, weight: 0, reps: 0 }
      ]
    }));

    setExercises(newExercises);
  };

  // Load initial template on mount
  useEffect(() => {
    if (initialTemplates.length > 0) {
      loadTemplate(initialTemplates[0].name);
    }
  }, [initialTemplates]);

  // ===== EXERCISE MANAGEMENT =====

  // Removes an entire exercise from the workout
  const removeExercise = (exerciseId: string) => {
    setExercises(exercises.filter(ex => ex.id !== exerciseId));
  };

  // Adds a new set to an existing exercise. New set inherits weight/reps from the last set as starting values
  const addSet = (exerciseId: string) => {
    setExercises(exercises.map(exercise => {
      if (exercise.id === exerciseId) {
        const newSet: Set = {
          id: Date.now().toString(),
          weight: exercise.sets.length > 0 ? exercise.sets[exercise.sets.length - 1].weight : 0,
          reps: exercise.sets.length > 0 ? exercise.sets[exercise.sets.length - 1].reps : 0
        };
        return { ...exercise, sets: [...exercise.sets, newSet] };
      }
      return exercise;
    }));
  };

  // Removes a specific set from an exercise only if exercise has more than one set
  const removeSet = (exerciseId: string, setId: string) => {
    setExercises(exercises.map(exercise => {
      if (exercise.id === exerciseId) {
        return { ...exercise, sets: exercise.sets.filter(set => set.id !== setId) };
      }
      return exercise;
    }));
  };

  // Updates weight or reps value for a specific set
  const updateSet = (exerciseId: string, setId: string, field: 'weight' | 'reps', value: number) => {
    setExercises(exercises.map(exercise => {
      if (exercise.id === exerciseId) {
        return {
          ...exercise,
          sets: exercise.sets.map(set =>
            set.id === setId ? { ...set, [field]: value } : set
          )
        };
      }
      return exercise;
    }));
  };

  // ===== EXERCISE AUTOCOMPLETE SYSTEM =====

  // Handles changes to the exercise name input field. Provides real-time autocomplete suggestions as user types
  const handleExerciseNameChange = (value: string) => {
    setNewExerciseName(value);

    // Only show suggestions if user has typed at least 3 characters
    if (value.length > 2) {
      // Filter exercise database for matches (case-insensitive)
      const matches = exerciseDatabase.filter(exercise =>
        exercise.toLowerCase().includes(value.toLowerCase())
      );
      setExerciseSuggestions(matches.slice(0, 5)); // Limit to 5 suggestions
    } else {
      setExerciseSuggestions([]); // Clear suggestions for short inputs
    }
  };

  // Adds a new exercise to the workout from the input field. Creates exercise with one empty set and clears input
  const addExerciseFromInput = () => {
    if (newExerciseName.trim()) {
      const newExercise: Exercise = {
        id: Date.now().toString(),
        name: newExerciseName.trim(),
        sets: [{ id: Date.now().toString(), weight: 0, reps: 0 }]
      };
      setExercises([...exercises, newExercise]);
      // Clear input and suggestions after adding
      setNewExerciseName("");
      setExerciseSuggestions([]);
    }
  };

  // Selects an exercise from the autocomplete suggestions
  const selectSuggestion = (suggestion: string) => {
    setNewExerciseName(suggestion);
    setExerciseSuggestions([]);
  };

  // Handles Enter key press to add exercise
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addExerciseFromInput();
    }
  };

  // Handle case where no templates are available - change to work without templates (freestyle workouts and option to save current workout as template)!!!!!!!
  if (initialTemplates.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-background">
        <div className="text-center py-12">
          <p className="text-muted-foreground">No workout templates available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto p-6 bg-background ${className}`}>
      {/* Header with template selector */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b">
        <div className="flex items-center gap-4">
          {/* Dropdown for selecting workout templates */}
          <Select value={selectedTemplate} onValueChange={loadTemplate}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {initialTemplates.map(template => (
                <SelectItem key={template.name} value={template.name}>
                  {template.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">Select Template</span>
        </div>
      </div>

      {/* Workout table */}
      <div className="rounded-lg border bg-card">
        <Table>
          {/* Table header with column labels */}
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12"></TableHead>
              <TableHead className="font-semibold">Exercises</TableHead>
              <TableHead className="text-center font-semibold w-20">Set</TableHead>
              <TableHead className="text-center font-semibold w-24">Weight</TableHead>
              <TableHead className="text-center font-semibold w-20">Reps</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* 
              ===== EXERCISE ROWS =====
              Each exercise can have multiple sets, so create a row for each set.
              Exercise name only appears on the first row of each exercise.
            */}
            {exercises.map((exercise) => (
              exercise.sets.map((set, setIndex) => (
                <TableRow key={`${exercise.id}-${set.id}`} className="group hover:bg-muted/30">
                  {/* Remove Exercise Button - Only show on first set of each exercise */}
                  <TableCell>
                    {setIndex === 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => removeExercise(exercise.id)}
                        title="Remove exercise"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                  {/* Exercise Name - Only show on first set of each exercise */}
                  <TableCell className="font-medium">
                    {setIndex === 0 ? exercise.name : ''}
                  </TableCell>
                  {/* Set Number - Shows which set this is (1, 2, 3, etc.) */}
                  <TableCell className="text-center">
                    <span className="text-sm text-muted-foreground">
                      {setIndex + 1}
                    </span>
                  </TableCell>
                  {/* Weight Input - Allows user to enter weight for this set */}
                  <TableCell className="text-center">
                    <Input
                      type="number"
                      value={set.weight || ''}
                      onChange={(e) => updateSet(exercise.id, set.id, 'weight', parseInt(e.target.value) || 0)}
                      className="w-20 h-8 text-center border-none bg-transparent focus:bg-background"
                      placeholder="0"
                    />
                  </TableCell>
                  {/* Reps Input - Allows user to enter repetitions for this set */}
                  <TableCell className="text-center">
                    <Input
                      type="number"
                      value={set.reps || ''}
                      onChange={(e) => updateSet(exercise.id, set.id, 'reps', parseInt(e.target.value) || 0)}
                      className="w-16 h-8 text-center border-none bg-transparent focus:bg-background"
                      placeholder="0"
                    />
                  </TableCell>
                  {/* Set Management Buttons */}
                  <TableCell>
                    {/* Add Set Button - Only show on the last set of each exercise */}
                    {setIndex === exercise.sets.length - 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={() => addSet(exercise.id)}
                        title="Add set"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                    {/* Remove Set Button - Only show if exercise has multiple sets and this isn't the first set */}
                    {exercise.sets.length > 1 && setIndex > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => removeSet(exercise.id, set.id)}
                        title="Remove set"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ))}
            {/* Add exercise row */}
            <TableRow className="border-dashed">
              <TableCell></TableCell>
              <TableCell colSpan={5}>
                <div className="relative">
                  {/* Exercise Input with Add Button */}
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-muted-foreground" />
                    <Input
                      value={newExerciseName}
                      onChange={(e) => handleExerciseNameChange(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type exercise name..."
                      className="flex-1 border-dashed bg-muted/20 hover:bg-muted/40"
                    />
                    <Button
                      onClick={addExerciseFromInput}
                      disabled={!newExerciseName.trim()}
                      size="sm"
                      variant="outline"
                    >
                      Add
                    </Button>
                  </div>

                  {/* Exercise suggestions dropdown */}
                  {exerciseSuggestions.length > 0 && (
                    <div className="absolute top-full left-6 right-0 z-10 mt-1 bg-popover border rounded-md shadow-md">
                      {exerciseSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          onClick={() => selectSuggestion(suggestion)}
                          className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground text-sm border-b last:border-b-0 flex items-center gap-2"
                        >
                          <Check className="h-3 w-3 text-green-500" />
                          {suggestion}
                          <span className="ml-auto text-xs text-muted-foreground">from database</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Action buttons */}
      <div className="flex justify-between mt-6">
        <Button variant="outline">Save Template</Button>
        <div className="flex gap-2">
          <Button variant="outline">Cancel</Button>
          <Button>Complete Workout</Button>
        </div>
      </div>
    </div>
  );
}