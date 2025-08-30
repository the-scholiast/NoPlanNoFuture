'use client';
import React from 'react';
import type { Task } from './types';
import { formatTime } from './utils';

interface TaskListProps {
  tasks: Task[];
  isDarkMode: boolean;
  onDeleteTask: (id?: string) => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, isDarkMode, onDeleteTask }) => {
  if (tasks.length === 0) return null;

  return (
    <div className={`p-4 rounded-lg shadow-lg min-w-[500px] ${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-300'}`}>
      <h3 className="text-lg font-bold mb-3">Tasks</h3>
      <div className="space-y-1">
        {tasks.map((task, index) => (
          <div key={task.id || index} className={`p-3 rounded flex items-center transition-colors ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}>
            <div className="flex-shrink-0 w-32 text-sm font-medium">
              {formatTime(task.start, task.hourGroup)}
            </div>
            <div className="flex-shrink-0 w-32 text-sm font-medium">
              {task.end < task.start && task.hourGroup === 'AM' ?
                formatTime(task.end, 'PM') :
                formatTime(task.end, task.hourGroup)
              }
            </div>
            <div className="font-medium flex-1 min-w-0 mx-3" title={task.title}>
              {task.title}
            </div>
            <div className={`text-xs px-2 py-1 rounded-full mr-2 ${task.source === 'timetable' ? (isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-700') : (isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-700')}`}>
              {task.source === 'timetable' ? 'Timetable' : 'Planner'}{task.isRecurring ? ' • Recurring' : ''}
            </div>
            {task.remarks && (
              <div className={`text-sm flex-1 min-w-0 mx-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} title={task.remarks}>
                {task.remarks}
              </div>
            )}
            {task.source === 'planner' ? (
              <button
                onClick={() => onDeleteTask(task.id)}
                className={`ml-3 flex-shrink-0 ${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-500'}`}
              >
                ✕
              </button>
            ) : (
              <span className={`ml-3 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Read-only</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskList;
