'use client';
import React, { useEffect, useState } from 'react';
import type { Task } from './types';
import { validateTimeString, parseTimeString, formatTimeInput } from './utils';

interface TaskFormProps {
  isVisible: boolean;
  onClose: () => void;
  onAddTask: (task: Task) => void;
  editingTask?: Task | null;
  onSaveTask?: (task: Task) => void;
}

const defaultTask: Task = {
  title: '',
  start: 0,
  end: 1,
  remarks: '',
  hourGroup: 'AM',
  source: 'planner',
};

// color palette + hour→24h helper
const COLORS = ['#60a5fa','#34d399','#fbbf24','#fb923c','#f87171','#a78bfa','#ec4899'];
const to24 = (h: number, g: 'AM' | 'PM') =>
  g === 'PM' && h !== 12 ? h + 12 : g === 'AM' && h === 12 ? 0 : h;

const TaskForm: React.FC<TaskFormProps> = ({
  isVisible,
  onClose,
  onAddTask,
  editingTask,
  onSaveTask,
}) => {
  const [newTask, setNewTask] = useState<Task>(editingTask ?? defaultTask);
  const [startTime, setStartTime] = useState<string>(
    editingTask ? `${editingTask.start}:00` : '12:00'
  );
  const [endTime, setEndTime] = useState<string>(
    editingTask ? `${editingTask.end}:00` : '1:00'
  );
  const [timeError, setTimeError] = useState<string>('');

  useEffect(() => {
    if (editingTask) {
      setNewTask(editingTask);
      setStartTime(`${editingTask.start}:00`);
      setEndTime(`${editingTask.end}:00`);
      setTimeError('');
    } else {
      setNewTask(defaultTask);
      setStartTime('12:00');
      setEndTime('1:00');
      setTimeError('');
    }
  }, [editingTask]);

  const handleTimeInput = (value: string, setter: (v: string) => void) => {
    setter(formatTimeInput(value));
    setTimeError('');
  };

  const validateTimes = (): boolean => {
    setTimeError('');
    if (!validateTimeString(startTime)) { setTimeError('Start time must be 1-12 (e.g., 9 or 9:30)'); return false; }
    if (!validateTimeString(endTime))   { setTimeError('End time must be 1-12 (e.g., 10 or 10:30)'); return false; }
  
    const s = parseTimeString(startTime);
    const e = parseTimeString(endTime);
  
    // Normalize 12 -> 0 for comparison within the same AM/PM period
    const norm = (h: number) => (h === 12 ? 0 : h);
    const sN = norm(s);
    const eN = norm(e);
  
    if (eN <= sN) {
      setTimeError('End time must be after start time');
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (!validateTimes() || !newTask.title.trim()) return;

    const s = parseTimeString(startTime);
    const e = parseTimeString(endTime);

    const taskBase: Task = {
      ...newTask,
      start: s,
      end: e,
      source: 'planner',
      id: editingTask?.id ?? `planner_${Date.now()}`,
    };

    if (editingTask && onSaveTask) {
      // Editing: preserve existing color if any
      onSaveTask(taskBase);
    } else {
      // Assign a stable color bucket by start time (24h)
      const s24 = to24(taskBase.start, taskBase.hourGroup);
      let idx = Math.floor(s24 / 3.5);
      if (idx >= COLORS.length) idx = COLORS.length - 1;
      (taskBase as any).color = COLORS[idx];
      onAddTask(taskBase);
    }

    // reset
    setNewTask(defaultTask);
    setStartTime('12:00');
    setEndTime('1:00');
    setTimeError('');
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white text-black p-6 rounded-lg shadow-lg w-96">
        <h3 className="text-lg font-bold mb-4">
          {editingTask ? 'Edit Task' : 'Add New Task'}
        </h3>

        <label className="block mb-2 font-semibold">Title</label>
        <input
          type="text"
          className="w-full border px-3 py-2 mb-3 rounded"
          value={newTask.title}
          onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
          placeholder="Enter task title"
        />

        <label className="block mb-2 font-semibold">Time Period</label>
        <select
          className="w-full border px-3 py-2 mb-3 rounded"
          value={newTask.hourGroup}
          onChange={(e) =>
            setNewTask({ ...newTask, hourGroup: e.target.value as 'AM' | 'PM' })
          }
        >
          <option value="AM">AM (Morning)</option>
          <option value="PM">PM (Afternoon/Evening)</option>
        </select>

        <div className="flex gap-3 mb-3">
          <div className="flex-1">
            <label className="block mb-2 font-semibold">Start Time</label>
            <input
              type="text"
              className="w-full border px-3 py-2 rounded"
              value={startTime}
              onChange={(e) => handleTimeInput(e.target.value, setStartTime)}
              placeholder="9 or 9:30"
            />
            <small className="text-gray-600">Format: H or H:MM (1-12)</small>
          </div>
          <div className="flex-1">
            <label className="block mb-2 font-semibold">End Time</label>
            <input
              type="text"
              className="w-full border px-3 py-2 rounded"
              value={endTime}
              onChange={(e) => handleTimeInput(e.target.value, setEndTime)}
              placeholder="10 or 10:30"
            />
            <small className="text-gray-600">Format: H or H:MM (1-12)</small>
          </div>
        </div>

        {timeError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-3">
            {timeError}
          </div>
        )}

        <label className="block mb-2 font-semibold">Notes</label>
        <textarea
          className="w-full border px-3 py-2 mb-4 rounded"
          rows={3}
          value={newTask.remarks}
          onChange={(e) => setNewTask({ ...newTask, remarks: e.target.value })}
          placeholder="Optional notes about this task"
        />

        <div className="flex justify-between gap-3">
          <button
            className="bg-green-500 px-4 py-2 rounded hover:bg-green-600 text-white font-semibold flex-1 transition-colors disabled:bg-gray-400"
            onClick={handleSubmit}
            disabled={!newTask.title.trim()}
          >
            {editingTask ? 'Save' : 'Add Task'}
          </button>
          <button
            className="bg-red-500 px-4 py-2 rounded hover:bg-red-600 text-white font-semibold flex-1 transition-colors"
            onClick={() => {
              setTimeError('');
              onClose();
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskForm;
