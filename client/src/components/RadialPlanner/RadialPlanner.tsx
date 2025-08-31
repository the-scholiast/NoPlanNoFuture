'use client';
import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useRadialPlanner } from './hooks/useRadialPlanner';
import TaskForm from './TaskForm';
import RadialClock from './RadialClock';
import TaskRenderer from './TaskRenderer';
import TaskList from './TaskList';
import type { Task } from './types';

// ===== Color helpers (keeps list + clock in sync even for old tasks) =====
const COLORS = ['#60a5fa','#34d399','#fbbf24','#fb923c','#f87171','#a78bfa','#ec4899'];
const to24 = (h: number, g: 'AM' | 'PM') =>
  g === 'PM' && h !== 12 ? h + 12 : g === 'AM' && h === 12 ? 0 : h;

function repairTaskColor<T extends { start: number; hourGroup: 'AM'|'PM'; color?: string }>(t: T): T {
  if ((t as any).color) return t;
  const s24 = to24(t.start, t.hourGroup);
  let idx = Math.floor(s24 / 3.5);
  if (idx >= COLORS.length) idx = COLORS.length - 1;
  return { ...t, color: COLORS[idx] };
}

const RadialPlanner: React.FC = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [formVisible, setFormVisible] = useState<boolean>(false);
  const [use24Hour, setUse24Hour] = useState<boolean>(true); // you can toggle in UI

  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const planner = useRadialPlanner();
  const {
    allTasks,
    addPlannerTask,
    deletePlannerTask,
    selectedDateString,
    isMounted,
  } = planner;

  // Try to persist repaired colors if the hook exposes a setter
  useEffect(() => {
    const maybeSetter = (planner as any)?.setAllTasks as
      | ((updater: (prev: Task[]) => Task[]) => void)
      | undefined;
    if (maybeSetter) {
      maybeSetter(prev => prev.map(repairTaskColor));
    }
  }, [planner]);

  // Geometry — SVG tightly wraps the circle
  const outerRadius = 260;
  const innerRadius = 180;
  const svgSize = outerRadius * 2;
  const svgCenter = outerRadius;

  const handleAddTask = (task: Task) => addPlannerTask(task);
  const handleDeleteTask = (id?: string) => deletePlannerTask(id);

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setFormVisible(true);
  };

  // NEW: save an edited task
  const handleSaveTask = (updated: Task) => {
    const maybeSetter = (planner as any)?.setAllTasks as
      | ((updater: (prev: Task[]) => Task[]) => void)
      | undefined;

      if (maybeSetter) {
        // replace in-place
        maybeSetter(prev => prev.map(t => (t.id === updated.id ? { ...updated } : t)));
      } else {
        // fallback (keeps color/id already on `updated`)
        deletePlannerTask(updated.id);
        addPlannerTask(updated);
      }
      setEditingTask(null);
      setFormVisible(false);
    };

  if (!isMounted) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Render with repaired colors (covers case where we couldn't persist)
  const repairedTasks: Task[] = allTasks.map(repairTaskColor);

  // ===== Numbers outside the ring (works for both 24h and 12h) =====
  const NumbersOverlay: React.FC = () => {
    const nodes: React.ReactElement[] = [];
    const r = outerRadius + 18; // distance outside the rim
    if (use24Hour) {
      for (let h = 0; h < 24; h++) {
        const angle = (h / 12) * Math.PI - Math.PI / 2; // 12 o'clock start
        const x = svgCenter + r * Math.cos(angle);
        const y = svgCenter + r * Math.sin(angle);
        const display = h === 0 ? 24 : h;
        nodes.push(
          <div
            key={`24-${h}`}
            className="absolute font-bold select-none"
            style={{
              left: 0,
              top: 0,
              transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
              fontSize: 14,
              color: isDarkMode ? '#e2e8f0' : '#2d3748',
              lineHeight: 1,
              pointerEvents: 'none',
            }}
          >
            {display}
          </div>
        );
      }
    } else {
      // 12-hour labels outside, 1..12
      for (let h = 0; h < 12; h++) {
        const angle = (h / 6) * Math.PI - Math.PI / 2; // 12 o'clock start
        const x = svgCenter + r * Math.cos(angle);
        const y = svgCenter + r * Math.sin(angle);
        const display = h === 0 ? 12 : h; // show 12 at top, then 1..11 clockwise
        nodes.push(
          <div
            key={`12-${h}`}
            className="absolute font-bold select-none"
            style={{
              left: 0,
              top: 0,
              transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
              fontSize: 16, // a bit larger for 12 labels
              color: isDarkMode ? '#e2e8f0' : '#2d3748',
              lineHeight: 1,
              pointerEvents: 'none',
            }}
          >
            {display}
          </div>
        );
      }
    }
    return <>{nodes}</>;
  };

  return (
    <div className={`flex flex-col items-center justify-center pb-10 p-4 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold" style={{ color: isDarkMode ? '#63b1bf' : '#2d3748' }}>
          Radial Day Planner
        </h1>
        {selectedDateString && <span className="text-lg text-gray-500">{selectedDateString}</span>}
      </div>

      {/* Time format selector */}
      <div className="flex items-center gap-4 mb-6">
        <span className="text-lg font-medium">Time Format:</span>
        <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
          <button
            className={`px-4 py-2 rounded-md transition-colors ${!use24Hour ? 'bg-blue-500 text-white' : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'}`}
            onClick={() => setUse24Hour(false)}
          >
            12-Hour
          </button>
          <button
            className={`px-4 py-2 rounded-md transition-colors ${use24Hour ? 'bg-blue-500 text-white' : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'}`}
            onClick={() => setUse24Hour(true)}
          >
            24-Hour
          </button>
        </div>
      </div>

      <button
        className="bg-blue-500 px-6 py-3 rounded-lg hover:bg-blue-600 mb-6 text-lg font-semibold transition-colors text-white"
        onClick={() => setFormVisible(true)}
      >
        Add Task
      </button>

      <TaskForm
        isVisible={formVisible}
        onClose={() => setFormVisible(false)}
        onAddTask={handleAddTask}
        editingTask={editingTask}
        onSaveTask={handleSaveTask}
      />

      <div className="flex flex-col lg:flex-row items-center gap-15">
        {/* Wrapper so the overlay can absolutely-position over the SVG */}
        <div className="relative inline-block" style={{ width: svgSize, height: svgSize }}>
          <svg
            width={svgSize}
            height={svgSize}
            viewBox={`0 0 ${svgSize} ${svgSize}`}
            className={`${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-300'} rounded-full shadow-lg`}
          >
            <RadialClock
              isDarkMode={isDarkMode}
              outerRadius={outerRadius}
              innerRadius={innerRadius}
              center={svgCenter}
              tasks={repairedTasks}
              use24Hour={use24Hour}
            />

            <TaskRenderer
              tasks={repairedTasks}
              isDarkMode={isDarkMode}
              outerRadius={outerRadius}
              innerRadius={innerRadius}
              center={svgCenter}
              use24Hour={use24Hour}
            />
          </svg>

          {/* Numbers outside the circle (doesn't change the viewBox) */}
          <NumbersOverlay />
        </div>

        <TaskList
          tasks={repairedTasks}
          isDarkMode={isDarkMode}
          onEdit={handleEditTask}
          onDeleteTask={handleDeleteTask}
        />
      </div>
    </div>
  );
};

export default RadialPlanner;
