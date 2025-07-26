// client/src/app/gym/workout/page.tsx
import WorkoutSheet from '@/components/gym/WorkoutSheet';

// Define proper types
interface WorkoutTemplate {
  name: string;
  exercises: string[];
}

export default function WorkoutPage() {
  // Use properly typed empty arrays
  const templates: WorkoutTemplate[] = [
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
    }
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Workout Tracker</h1>
      </div>

      <WorkoutSheet
        initialTemplates={templates}
      />
    </div>
  );
}