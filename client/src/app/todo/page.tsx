import { TodoBoard, CompletedTasks } from '@/components/todo';

export default function Page() {
  return (
    <div className="flex-1">
      {/* Header positioned to align with the add button that's above */}
      <div className="flex items-center justify-center -mt-18 mb-6 h-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-blue-600">
            To Do
          </h1>
        </div>
      </div>

      <TodoBoard />
      <CompletedTasks />
    </div>
  );
}