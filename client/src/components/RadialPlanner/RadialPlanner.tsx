'use client';
import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import { useRadialPlanner } from './hooks/useRadialPlanner';
import TaskForm from './TaskForm';
import RadialClock from './RadialClock';
import TaskRenderer from './TaskRenderer';
import TaskList from './TaskList';
import type { Task } from './types';

const RadialPlanner: React.FC = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [formVisible, setFormVisible] = useState<boolean>(false);
  const [use24Hour, setUse24Hour] = useState<boolean>(false);
  
  const {
    allTasks,
    addPlannerTask,
    deletePlannerTask,
    selectedDateString,
    isMounted
  } = useRadialPlanner();

  // Clock dimensions - optimized for new design
  const outerRadius = 130;
  const innerRadius = 90;
  const center = 200;
  
  // Calculate SVG dimensions based on clock size
  const svgSize = (center + outerRadius + 60) * 2; // Add padding for numbers and labels
  
  // Calculate new center point for the SVG to ensure perfect centering
  const svgCenter = svgSize / 2;

  const handleAddTask = (task: Task) => {
    addPlannerTask(task);
  };

  const handleDeleteTask = (id?: string) => {
    deletePlannerTask(id);
  };

  if (!isMounted) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center pb-10 p-4 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className="flex items-center gap-4 mb-6">
        <h1
          className="text-3xl font-bold"
          style={{ color: isDarkMode ? '#63b1bf' : '#2d3748' }}
        >
          Radial Day Planner
        </h1>
        {selectedDateString && (
          <span className="text-lg text-gray-500">
            {selectedDateString}
          </span>
        )}
      </div>

      {/* Time format selector */}
      <div className="flex items-center gap-4 mb-6">
        <span className="text-lg font-medium">Time Format:</span>
        <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
          <button
            className={`px-4 py-2 rounded-md transition-colors ${
              !use24Hour
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
            }`}
            onClick={() => setUse24Hour(false)}
          >
            12-Hour
          </button>
          <button
            className={`px-4 py-2 rounded-md transition-colors ${
              use24Hour
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white'
            }`}
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
      />

      <div className="flex flex-col lg:flex-row items-start gap-8">
        <svg
          width={svgSize}
          height={svgSize}
          className={`${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-300'} rounded-full shadow-lg`}
          viewBox={`0 0 ${svgSize} ${svgSize}`}
        >
          <RadialClock
            isDarkMode={isDarkMode}
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            center={svgCenter}
            tasks={allTasks}
            use24Hour={use24Hour}
          />
          
          <TaskRenderer
            tasks={allTasks}
            isDarkMode={isDarkMode}
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            center={svgCenter}
            use24Hour={use24Hour}
          />
        </svg>

        <TaskList
          tasks={allTasks}
          isDarkMode={isDarkMode}
          onDeleteTask={handleDeleteTask}
        />
      </div>
    </div>
  );
};

export default RadialPlanner;