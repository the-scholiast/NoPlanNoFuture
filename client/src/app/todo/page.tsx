import TodoBoard from '@/components/todo/TodoBoard';

export default function Page() {
  return (
    <div className="flex-1">
      {/* Header positioned to align with the add button that's above */}
      <div className="flex items-center justify-center -mt-18 mb-6 h-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent">
            To Do
          </h1>
          <div className="h-0.5 w-16 bg-gradient-to-r from-primary via-purple-600 to-blue-600 rounded-full mx-auto mt-1"></div>
        </div>
      </div>

      <TodoBoard />
    </div>
  );
}