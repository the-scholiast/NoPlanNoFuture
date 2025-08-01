import TodoBoard from '@/components/todo/TodoBoard';

export default function Page() {
  return (
    <div className="flex-1">
      {/* Header positioned to align with the add button that's above */}
      <div className="flex items-center justify-center -mt-18 mb-6 h-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            To Do
          </h1>
        </div>
      </div>

      <TodoBoard />
    </div>
  );
}