"use client"

import React, { useState, useEffect } from 'react';
import { X, Plus, Check, Save, Clock, StickyNote, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Textarea } from '../ui/textarea';
import { saveCompletedWorkout, createWorkoutTemplate, getWorkoutTemplates } from '@/lib/api/workoutApi';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import ExerciseInput from './ExerciseInput';

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
  completed?: boolean;
}

interface WorkoutTemplate {
  name: string;
  exercises: string[];
}

interface WorkoutSheetProps {
  className?: string;
}

export default function WorkoutSheet({
  className
}: WorkoutSheetProps) {
  const { user, loading: authLoading } = useAuth();

  // ===== STATE MANAGEMENT =====
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([]);

  // Workout completion state
  const [workoutName, setWorkoutName] = useState("");
  const [workoutNotes, setWorkoutNotes] = useState("");
  const [workoutDuration, setWorkoutDuration] = useState<number>(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isWorkoutCompleted, setIsWorkoutCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshingTemplates, setIsRefreshingTemplates] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);

  // Wait for authentication to be ready
  useEffect(() => {
    const waitForAuth = async () => {
      if (authLoading) {
        console.log('🔄 Waiting for auth to load...');
        return;
      }

      if (!user) {
        console.log('❌ No user found after auth loading');
        setAuthReady(false);
        return;
      }

      // Wait a bit more and verify session
      await new Promise(resolve => setTimeout(resolve, 500));

      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('🔍 Final session check:', {
          hasSession: !!session,
          hasToken: !!session?.access_token,
          userId: user.id,
          email: user.email
        });

        if (session?.access_token) {
          console.log('✅ Auth ready for API calls');
          setAuthReady(true);
        } else {
          console.log('⏳ Session not ready, retrying...');
          // Retry once more
          setTimeout(() => waitForAuth(), 1000);
        }
      } catch (error) {
        console.error('❌ Auth check failed:', error);
        setAuthReady(false);
      }
    };

    waitForAuth();
  }, [user, authLoading]);

  // Load user templates once auth is ready
  useEffect(() => {
    if (authReady && !templatesLoaded) {
      refreshTemplates();
    }
  }, [authReady, templatesLoaded]);

  // ===== TEMPLATE MANAGEMENT =====
  const refreshTemplates = async () => {
    if (!authReady) {
      console.log('⏳ Auth not ready, skipping template refresh');
      return;
    }

    setIsRefreshingTemplates(true);
    try {
      console.log('Refreshing templates...');
      const newTemplates = await getWorkoutTemplates();
      console.log('Fetched templates:', newTemplates);
      setTemplates(newTemplates);
      setTemplatesLoaded(true);
    } catch (error) {
      console.error('Error refreshing templates:', error);
      // Don't keep existing templates on error, show empty state
      setTemplates([]);
      setTemplatesLoaded(true);
    } finally {
      setIsRefreshingTemplates(false);
    }
  };

  const loadTemplate = (templateName: string) => {
    setSelectedTemplate(templateName);

    const template = templates.find(t => t.name === templateName);
    if (!template) return;

    // Create new exercises with default sets
    const newExercises: Exercise[] = template.exercises.map((exerciseName, index) => ({
      id: `${Date.now()}-${index}`,
      name: exerciseName,
      sets: [
        { id: `${Date.now()}-${index}-1`, weight: 0, reps: 0, completed: false }
      ]
    }));

    setExercises(newExercises);
    setWorkoutName(templateName);
    setStartTime(new Date());
    setIsWorkoutCompleted(false);
  };

  // ===== EXERCISE MANAGEMENT =====
  const removeExercise = (exerciseId: string) => {
    setExercises(exercises.filter(ex => ex.id !== exerciseId));
  };

  const addSet = (exerciseId: string) => {
    setExercises(exercises.map(exercise => {
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

  const removeSet = (exerciseId: string, setId: string) => {
    setExercises(exercises.map(exercise => {
      if (exercise.id === exerciseId) {
        return {
          ...exercise,
          sets: exercise.sets.filter(set => set.id !== setId)
        };
      }
      return exercise;
    }));
  };

  const updateSet = (exerciseId: string, setId: string, field: 'weight' | 'reps' | 'completed', value: number | boolean) => {
    setExercises(exercises.map(exercise => {
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

  // ===== WORKOUT COMPLETION =====
  const completeWorkout = async () => {
    if (!authReady) {
      alert('Please wait for authentication to complete');
      return;
    }

    if (!workoutName.trim()) {
      alert('Please enter a workout name');
      return;
    }

    const endTime = new Date();
    const duration = startTime ? Math.round((endTime.getTime() - startTime.getTime()) / 1000 / 60) : 0;
    setWorkoutDuration(duration);

    setIsSaving(true);

    try {
      const workoutData = {
        name: workoutName,
        exercises,
        notes: workoutNotes,
        duration_minutes: duration,
        date: new Date().toISOString().split('T')[0]
      };

      console.log('Saving workout:', workoutData);
      const savedWorkout = await saveCompletedWorkout(workoutData);

      if (savedWorkout) {
        setIsWorkoutCompleted(true);
        alert(`Workout "${workoutName}" completed and saved! 🎉`);
        console.log('Workout saved:', savedWorkout);
      } else {
        throw new Error('Failed to save workout');
      }
    } catch (error) {
      console.error('Error saving workout:', error);
      alert('Failed to save workout. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const saveAsTemplate = async () => {
    if (!authReady) {
      alert('Please wait for authentication to complete');
      return;
    }

    if (!workoutName.trim()) {
      alert('Please enter a workout name');
      return;
    }

    setIsSaving(true);

    try {
      const templateData = {
        name: `${workoutName} Template`,
        exercises: exercises.map(ex => ex.name),
        is_public: false
      };

      console.log('Saving template:', templateData);
      const savedTemplate = await createWorkoutTemplate(templateData);

      if (savedTemplate) {
        alert(`Template "${templateData.name}" saved successfully! 🎉`);
        console.log('Template saved:', savedTemplate);

        // Refresh templates to show the new one
        await refreshTemplates();
      } else {
        throw new Error('Failed to save template');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const startNewWorkout = () => {
    setExercises([]);
    setWorkoutName("");
    setWorkoutNotes("");
    setWorkoutDuration(0);
    setStartTime(new Date());
    setIsWorkoutCompleted(false);
    setSelectedTemplate("");
  };

  return (
    <div className={`max-w-6xl mx-auto p-6 space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Workout Tracker</h2>
          {startTime && !isWorkoutCompleted && (
            <p className="text-sm text-gray-600">
              Started: {startTime.toLocaleTimeString()}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          {!isWorkoutCompleted ? (
            <>
              <Button
                onClick={completeWorkout}
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
              <Button
                onClick={saveAsTemplate}
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
            <Button onClick={startNewWorkout} className="bg-blue-600 hover:bg-blue-700">
              Start New Workout
            </Button>
          )}
        </div>
      </div>

      {/* Workout Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Workout Name</label>
          <Input
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            placeholder="Enter workout name"
            disabled={isWorkoutCompleted}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Load Template</label>
          <div className="flex gap-2">
            <Select value={selectedTemplate} onValueChange={loadTemplate} disabled={isWorkoutCompleted}>
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
            <Button
              onClick={refreshTemplates}
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

        <div>
          <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
          <Input
            type="number"
            value={workoutDuration}
            onChange={(e) => setWorkoutDuration(Number(e.target.value))}
            placeholder="0"
            disabled={isWorkoutCompleted}
          />
        </div>
      </div>

      {/* Workout Notes */}
      <div>
        <label className="text-sm font-medium mb-1 flex items-center gap-2">
          <StickyNote className="h-4 w-4" />
          Workout Notes
        </label>
        <Textarea
          value={workoutNotes}
          onChange={(e) => setWorkoutNotes(e.target.value)}
          placeholder="How did the workout go? Any observations?"
          disabled={isWorkoutCompleted}
          rows={3}
        />
      </div>

      {/* Add Exercise Section */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Add Exercise</h3>
        <ExerciseInput
          onExerciseAdd={(exerciseName: string) => {
            const newExercise: Exercise = {
              id: Date.now().toString(),
              name: exerciseName,
              sets: [
                { id: Date.now().toString(), weight: 0, reps: 0, completed: false }
              ]
            };
            setExercises([...exercises, newExercise]);
            if (!startTime) {
              setStartTime(new Date());
            }
          }}
          disabled={isWorkoutCompleted}
        />
      </div>

      {/* Exercise List */}
      {exercises.length > 0 && (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Exercises</h3>
          {exercises.map((exercise) => (
            <div key={exercise.id} className="border rounded-lg p-4 space-y-4">
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
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={set.weight}
                          onChange={(e) => updateSet(exercise.id, set.id, 'weight', Number(e.target.value))}
                          className="w-20"
                          disabled={isWorkoutCompleted}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={set.reps}
                          onChange={(e) => updateSet(exercise.id, set.id, 'reps', Number(e.target.value))}
                          className="w-20"
                          disabled={isWorkoutCompleted}
                        />
                      </TableCell>
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