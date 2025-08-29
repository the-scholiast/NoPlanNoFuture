"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { searchExercises, createCustomExercise } from '@/lib/api/';

interface ExerciseInputProps {
  onExerciseAdd: (exerciseName: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

interface ExerciseDatabase {
  id: string;
  name: string;
  is_custom: boolean;
  created_by?: string;
}

export default function ExerciseInput({ 
  onExerciseAdd, 
  disabled = false,
  placeholder = "Search for an exercise..."
}: ExerciseInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<ExerciseDatabase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (inputValue.trim().length > 1) {
        searchExerciseDatabase(inputValue.trim());
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [inputValue]);

  // Search exercises in database
  const searchExerciseDatabase = async (searchTerm: string) => {
    try {
      setIsLoading(true);
      const results = await searchExercises(searchTerm);
      setSuggestions(results);
      setShowSuggestions(true);
      setHighlightedIndex(-1);
    } catch (error) {
      console.error('Error searching exercises:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Select an exercise from suggestions
  const selectExercise = (exerciseName: string) => {
    onExerciseAdd(exerciseName);
    setInputValue('');
    setSuggestions([]);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
  };

  // Add new exercise (create if doesn't exist)
  const handleAddExercise = async () => {
    const trimmedName = inputValue.trim();
    if (!trimmedName) return;

    // Check if exercise already exists in suggestions
    const existingExercise = suggestions.find(
      ex => ex.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (existingExercise) {
      selectExercise(existingExercise.name);
      return;
    }

    // Create new custom exercise
    try {
      setIsCreating(true);
      
      const newExercise = await createCustomExercise({
        name: trimmedName,
      });

      if (newExercise) {
        onExerciseAdd(newExercise.name);
        setInputValue('');
        setSuggestions([]);
        setShowSuggestions(false);
        
        // Show success feedback
        console.log(`✅ Created new exercise: ${newExercise.name}`);
      } else {
        throw new Error('Failed to create exercise');
      }
    } catch (error) {
      console.error('Error creating exercise:', error);
      // Still add the exercise locally even if database creation fails
      onExerciseAdd(trimmedName);
      setInputValue('');
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsCreating(false);
    }
  };

    // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showSuggestions) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0) {
            selectExercise(suggestions[highlightedIndex].name);
          } else if (inputValue.trim()) {
            handleAddExercise();
          }
          break;
        case 'Escape':
          setShowSuggestions(false);
          setHighlightedIndex(-1);
          break;
      }
    };

    if (showSuggestions) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showSuggestions, highlightedIndex, suggestions, inputValue, handleAddExercise, selectExercise]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    if (value.trim().length <= 1) {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle input focus
  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Handle clicking outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">Add Exercise</label>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <div className="relative">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              placeholder={placeholder}
              disabled={disabled || isCreating}
              className="pr-8"
            />
            {(isLoading || isCreating) && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              </div>
            )}
            {!isLoading && !isCreating && inputValue && (
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
            )}
          </div>
          
          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div 
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 bg-background border border-gray-200 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto mt-1"
            >
              {suggestions.map((exercise, index) => (
                <button
                  key={exercise.id}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0 transition-colors ${
                    index === highlightedIndex ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => selectExercise(exercise.name)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{exercise.name}</span>
                    {exercise.is_custom && (
                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                        Custom
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No results / Create new option */}
          {showSuggestions && suggestions.length === 0 && inputValue.trim().length > 1 && !isLoading && (
            <div 
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 mt-1"
            >
              <button
                className="w-full text-left px-3 py-2 hover:bg-gray-100 border-b border-gray-100"
                onClick={handleAddExercise}
                disabled={isCreating}
              >
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-green-600" />
                  <span>
                    Create <span className="font-medium">{inputValue.trim()}</span>
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  This will be added to your exercise database
                </p>
              </button>
            </div>
          )}
        </div>

        <Button
          onClick={handleAddExercise}
          disabled={!inputValue.trim() || disabled || isCreating}
          className="px-3"
        >
          {isCreating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Helper text */}
      <p className="text-xs text-gray-500">
        {`Start typing to search exercises. If not found, we'll create a new one for you.`}
      </p>
    </div>
  );
}