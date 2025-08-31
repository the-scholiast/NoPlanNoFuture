'use client';
import React, { useState } from 'react';
import { useTheme } from 'next-themes';
import RadialClock from './RadialClock';
import TaskRenderer from './TaskRenderer';
import type { Task } from './types';

const TestPage: React.FC = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [use24Hour, setUse24Hour] = useState<boolean>(false);

  // Sample task data
  const [sampleTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Sleep',
      start: 0,
      end: 3,
      remarks: 'Night rest',
      hourGroup: 'AM',
      source: 'planner'
    },
    {
      id: '2',
      title: 'Morning Run',
      start: 6,
      end: 7,
      remarks: 'Morning exercise',
      hourGroup: 'AM',
      source: 'planner'
    },
    {
      id: '3',
      title: 'Breakfast',
      start: 7,
      end: 8,
      remarks: 'Nutrition breakfast',
      hourGroup: 'AM',
      source: 'planner'
    },
    {
      id: '4',
      title: 'Team Meeting',
      start: 9,
      end: 10,
      remarks: 'Team discussion',
      hourGroup: 'AM',
      source: 'planner'
    },
    {
      id: '5',
      title: 'Lunch',
      start: 12,
      end: 12.17, // 12:10
      remarks: 'Lunch break',
      hourGroup: 'PM',
      source: 'planner'
    },
    {
      id: '6',
      title: 'Development',
      start: 13.5, // 13:30
      end: 14.5, // 14:30
      remarks: 'Coding',
      hourGroup: 'PM',
      source: 'planner'
    },
    {
      id: '7',
      title: 'Collaboration',
      start: 15,
      end: 18,
      remarks: 'Project discussion',
      hourGroup: 'PM',
      source: 'planner'
    },
    {
      id: '8',
      title: 'Dinner',
      start: 18,
      end: 18.5, // 18:30
      remarks: 'Evening meal',
      hourGroup: 'PM',
      source: 'planner'
    },
    {
      id: '9',
      title: 'Learning',
      start: 19,
      end: 20,
      remarks: 'Skill improvement',
      hourGroup: 'PM',
      source: 'planner'
    },
    {
      id: '10',
      title: 'Relaxation',
      start: 21.5, // 21:30
      end: 22.5, // 22:30
      remarks: 'Leisure time',
      hourGroup: 'PM',
      source: 'planner'
    }
  ]);

  // Clock dimensions - optimized for new design
  const outerRadius = 130;
  const innerRadius = 90;
  const center = 200;

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4" style={{ color: isDarkMode ? '#63b1bf' : '#2d3748' }}>
          Plan your day!
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Radial 24-Hour Daily Planner
        </p>
      </div>

      {/* Time format selector */}
      <div className="flex items-center gap-4 mb-8">
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

      <div className="flex flex-col lg:flex-row items-start gap-12">
        {/* Left: Empty template */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: isDarkMode ? '#e2e8f0' : '#2d3748' }}>
            {use24Hour ? '24-Hour Template' : '12-Hour Template'}
          </h2>
          <svg
            width="500"
            height="500"
            className={`${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-300'} rounded-full shadow-lg`}
            viewBox="0 0 500 500"
          >
            <RadialClock
              isDarkMode={isDarkMode}
              outerRadius={outerRadius}
              innerRadius={innerRadius}
              center={center}
              tasks={[]}
              use24Hour={use24Hour}
            />
          </svg>
        </div>

        {/* Right: Sample tasks */}
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4" style={{ color: isDarkMode ? '#e2e8f0' : '#2d3748' }}>
            Sample Schedule
          </h2>
          <svg
            width="500"
            height="500"
            className={`${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-300'} rounded-full shadow-lg`}
            viewBox="0 0 500 500"
          >
            <RadialClock
              isDarkMode={isDarkMode}
              outerRadius={outerRadius}
              innerRadius={innerRadius}
              center={center}
              tasks={sampleTasks}
              use24Hour={use24Hour}
            />
            
            <TaskRenderer
              tasks={sampleTasks}
              isDarkMode={isDarkMode}
              outerRadius={outerRadius}
              innerRadius={innerRadius}
              center={center}
              use24Hour={use24Hour}
            />
          </svg>
        </div>
      </div>

      {/* Description */}
      <div className="mt-12 max-w-4xl text-center">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
            <h3 className="text-xl font-semibold mb-3">Design Features</h3>
            <ul className="text-left space-y-2 text-gray-600 dark:text-gray-400">
              <li>• {use24Hour ? '24-hour complete time scale' : '12-hour double layer design'}</li>
              <li>• {use24Hour ? '10-minute intervals' : '30-minute intervals for outer ring'}</li>
              <li>• {use24Hour ? 'Single layer pie chart' : 'Outer donut + inner pie chart'}</li>
              <li>• Task length adjusts based on duration</li>
              <li>• Clean design with no borders or text</li>
            </ul>
          </div>
          
          <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
            <h3 className="text-xl font-semibold mb-3">How to Use</h3>
            <ul className="text-left space-y-2 text-gray-600 dark:text-gray-400">
              <li>• Click "Add Task" to add new tasks</li>
              <li>• Set task start and end times</li>
              <li>• Tasks automatically display in correct time positions</li>
              <li>• Colors represent different time periods</li>
              <li>• Task size reflects duration length</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPage;
