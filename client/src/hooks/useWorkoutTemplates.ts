'use client'

import { useState, useEffect } from 'react';
import { getWorkoutTemplates, createWorkoutTemplate } from '@/lib/api/';
import type { WorkoutTemplate, Exercise } from '@/types/workoutTypes';

// Custom hook for managing workout templates
// Handles loading, refreshing, and selecting workout templates

export function useWorkoutTemplates(authReady: boolean) {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [isRefreshingTemplates, setIsRefreshingTemplates] = useState(false);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);

  // Load user templates once auth is ready
  useEffect(() => {
    if (authReady && !templatesLoaded) {
      refreshTemplates();
    }
  }, [authReady, templatesLoaded]);

  // Refresh templates from API
  const refreshTemplates = async () => {
    if (!authReady) {
      console.log('Auth not ready, skipping template refresh');
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

  // Save current workout as a template
  const saveAsTemplate = async (workoutName: string, exercises: Exercise[]) => {
    if (!authReady) {
      throw new Error('Authentication not ready');
    }

    if (!workoutName.trim()) {
      throw new Error('Please enter a workout name');
    }

    const templateData = {
      name: `${workoutName} Template`,
      exercises: exercises.map(ex => ex.name),
      is_public: false
    };

    console.log('Saving template:', templateData);
    const savedTemplate = await createWorkoutTemplate(templateData);

    if (savedTemplate) {
      console.log('Template saved:', savedTemplate);
      // Refresh templates to show the new one
      await refreshTemplates();
      return savedTemplate;
    } else {
      throw new Error('Failed to save template');
    }
  };

  return {
    templates,
    selectedTemplate,
    setSelectedTemplate,
    isRefreshingTemplates,
    templatesLoaded,
    refreshTemplates,
    saveAsTemplate
  };
}