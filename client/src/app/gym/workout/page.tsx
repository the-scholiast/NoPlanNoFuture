import { getWorkoutTemplates, getExerciseDatabase } from '@/lib/api/workoutApi';
import WorkoutSheet from '@/components/gym/WorkoutSheet';

export default async function WorkoutPage() {
  // Server-side data fetching - change to database calls
  const templates = await getWorkoutTemplates();
  const exercises = await getExerciseDatabase();

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Workout Tracker</h1>
      </div>

      <WorkoutSheet
        initialTemplates={templates}
        exerciseDatabase={exercises}
      />
    </div>
  );
}