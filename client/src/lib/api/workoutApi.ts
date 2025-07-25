export interface WorkoutTemplate {
  name: string;
  exercises: string[];
}

// Placeholder data - replace with database calls
const workoutTemplatesData: WorkoutTemplate[] = [
  {
    name: "Push Day Template",
    exercises: ["Bench Press", "Overhead Press", "Incline Press", "Tricep Dips", "Lateral Raises"]
  },
  {
    name: "Pull Day Template",
    exercises: ["Pull-ups", "Deadlifts", "Bent-over Rows", "Lat Pulldowns", "Bicep Curls"]
  },
  {
    name: "Leg Day Template",
    exercises: ["Squats", "Leg Press", "Lunges", "Leg Curls", "Calf Raises"]
  },
  {
    name: "Upper Body Template",
    exercises: ["Bench Press", "Pull-ups", "Overhead Press", "Bent-over Rows", "Dumbbell Flyes"]
  },
  {
    name: "Full Body Template",
    exercises: ["Squats", "Deadlifts", "Bench Press", "Pull-ups", "Overhead Press"]
  },
  {
    name: "Strength Template",
    exercises: ["Squat", "Deadlift", "Bench Press", "Overhead Press", "Bent-over Row"]
  },
  {
    name: "Hypertrophy Template",
    exercises: ["Incline Press", "Cable Flyes", "Lat Pulldowns", "Cable Rows", "Leg Press"]
  }
];

const exerciseDatabaseData: string[] = [
  // Chest exercises
  "Bench Press", "Incline Bench Press", "Decline Bench Press", "Dumbbell Bench Press",
  "Cable Flyes", "Dumbbell Flyes", "Push-ups", "Diamond Push-ups",
  
  // Shoulder exercises
  "Overhead Press", "Military Press", "Push Press", "Seated Shoulder Press",
  "Lateral Raises", "Front Raises", "Rear Delt Flyes", "Upright Rows",
  
  // Leg exercises
  "Squat", "Front Squat", "Back Squat", "Bulgarian Split Squat",
  "Leg Press", "Leg Curls", "Leg Extensions", "Calf Raises",
  "Lunges", "Walking Lunges", "Reverse Lunges", "Jump Lunges",
  
  // Back exercises
  "Deadlift", "Romanian Deadlift", "Sumo Deadlift", "Stiff Leg Deadlift",
  "Pull-ups", "Chin-ups", "Lat Pulldowns", "Wide Grip Pulldowns",
  "Bent-over Rows", "Barbell Rows", "Dumbbell Rows", "Cable Rows",
  
  // Arm exercises
  "Tricep Dips", "Close Grip Bench Press", "Tricep Extensions",
  "Bicep Curls", "Hammer Curls", "Preacher Curls", "Cable Curls"
];

/**
 * Get all workout templates
 * Future: Replace with database call
 */
export async function getWorkoutTemplates(): Promise<WorkoutTemplate[]> {
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 100));
  return workoutTemplatesData;
}

/**
 * Get all exercises for autocomplete
 * Future: replace with database call
 */
export async function getExerciseDatabase(): Promise<string[]> {
  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 50));
  return exerciseDatabaseData;
}

/**
 * Search exercises by query
 * Future: database search with more sophisticated matching
 */
export async function searchExercises(query: string, limit: number = 5): Promise<string[]> {
  if (query.length <= 2) return [];
  
  const exercises = await getExerciseDatabase();
  
  const matches = exercises.filter(exercise =>
    exercise.toLowerCase().includes(query.toLowerCase())
  );
  
  return matches.slice(0, limit);
}

/**
 * Get exercises for a specific template
 * Future: query database for template by ID
 */
export async function getTemplateExercises(templateName: string): Promise<string[]> {
  const templates = await getWorkoutTemplates();
  const template = templates.find(t => t.name === templateName);
  return template ? template.exercises : [];
}