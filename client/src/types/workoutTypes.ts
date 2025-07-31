// Represents a single set within an exercise
export interface Set {
  id: string;
  weight: number; // Weight used in pounds
  reps: number; // Number of repetitions performed
  completed?: boolean; // Whether this set has been completed
}

// Represents an exercise within a workout
export interface Exercise {
  id: string;
  name: string; // Name of the exercise
  sets: Set[]; // Array of sets performed for this exercise
}

// Represents a workout template for reuse
export interface WorkoutTemplate {
  id?: string; // Add id to match API
  name: string; // Name of the template
  exercises: string[]; // Array of exercise names included in the template
  is_public?: boolean; // Whether the template is publicly available
  created_at?: string; // Timestamp when created
  updated_at?: string; // Timestamp when updated
}

// Represents an exercise in the database (built-in + custom)
export interface ExerciseDatabase {
  id: string;
  name: string;
  is_custom: boolean;
  created_by?: string;
}

// Represents a completed workout
export interface CompletedWorkout {
  id?: string; // Make optional for creation
  name: string; // Name of the workout
  template_id?: string; // Reference to template used
  exercises: Exercise[]; // Array of exercises performed (not any[])
  notes?: string; // Optional notes about the workout
  duration_minutes?: number; // Duration of the workout in minutes
  date: string; // Date the workout was performed (YYYY-MM-DD format)
  created_at?: string; // Timestamp when the workout was created
}

// =============================================
// API request/response types
// =============================================

// Request types for creating/updating
export interface CreateWorkoutTemplateRequest {
  name: string;
  exercises: string[];
  is_public?: boolean;
}

export interface UpdateWorkoutTemplateRequest {
  name?: string;
  exercises?: string[];
  is_public?: boolean;
}

export interface SaveCompletedWorkoutRequest {
  name: string;
  template_id?: string;
  exercises: Exercise[];
  notes?: string;
  duration_minutes?: number;
  date?: string;
}

export interface UpdateCompletedWorkoutRequest {
  name?: string;
  exercises?: Exercise[];
  notes?: string;
  duration_minutes?: number;
}

export interface CreateCustomExerciseRequest {
  name: string;
}

// Response wrapper types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ApiError {
  error: string;
  message?: string;
  status?: number;
}

// =============================================
// Component prop types
// =============================================

// Props for the main WorkoutSheet component
export interface WorkoutSheetProps {
  className?: string; // Optional CSS class name for styling
}

// Props for the CompletedWorkoutView component
export interface CompletedWorkoutViewProps {
  workout: CompletedWorkout; // The completed workout to display
  onStartNewWorkout: () => void; // Callback to start a new workout
  router: any; // Router instance for navigation (consider using NextRouter type)
  className?: string; // Optional CSS class name
}

// Props for the ActiveWorkoutEditor component
export interface ActiveWorkoutEditorProps {
  workoutName: string; // Current workout name
  onWorkoutNameChange: (name: string) => void; // Callback when workout name changes
  workoutNotes: string; // Current workout notes
  onWorkoutNotesChange: (notes: string) => void; // Callback when workout notes change
  workoutDuration: number; // Current workout duration in minutes
  onWorkoutDurationChange: (duration: number) => void; // Callback when duration changes
  exercises: Exercise[]; // Current exercises array
  onExercisesChange: (exercises: Exercise[]) => void; // Callback when exercises change
  templates: WorkoutTemplate[]; // Available templates
  selectedTemplate: string; // Selected template name
  onTemplateSelect: (templateName: string) => void; // Callback when template is selected
  isRefreshingTemplates: boolean; // Whether templates are currently being refreshed
  onRefreshTemplates: () => void; // Callback to refresh templates
  templatesLoaded: boolean; // Whether templates have been loaded
  isWorkoutCompleted: boolean; // Whether workout is completed
  authReady: boolean; // Whether auth is ready
  isSaving: boolean; // Whether currently saving
  startTime: Date | null; // Start time of the workout
  onCompleteWorkout: () => void; // Callback to complete workout
  onSaveAsTemplate: () => void; // Callback to save as template
  onStartNewWorkout: () => void; // Callback to start new workout
  className?: string; // Optional CSS class name
}

// Additional component prop types
export interface ExerciseEditorProps {
  exercise: Exercise;
  onExerciseChange: (exercise: Exercise) => void;
  onRemoveExercise: () => void;
  className?: string;
}

export interface SetEditorProps {
  set: Set;
  onSetChange: (set: Set) => void;
  onRemoveSet: () => void;
  className?: string;
}

export interface WorkoutTemplateCardProps {
  template: WorkoutTemplate;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isSelected: boolean;
  className?: string;
}