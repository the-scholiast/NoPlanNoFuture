'use client';
import React from 'react';
import type { Task } from './types';

const fmt12 = (h: number) => {
  const whole = Math.floor(h);
  const min = Math.round((h - whole) * 60);
  const mm = min.toString().padStart(2, '0');
  return `${whole}:${mm}`;
};

interface TaskListProps {
  tasks: Task[];
  isDarkMode?: boolean;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  onDeleteTask?: (id?: string) => void; // 可用現有刪除邏輯
}

const TaskList: React.FC<TaskListProps> = ({
  tasks,
  isDarkMode,
  onEdit,
  onDelete,
  onDeleteTask,
}) => {
  return (
    <div className="space-y-2">
      {tasks.map((task, index) => {
        const key = task.id || `t_${index}`;
        const color = task.color ?? '#60a5fa';
        const timeStr = `${fmt12(task.start)}–${fmt12(task.end)} ${task.hourGroup}`;
        const isPlanner = task.source === 'planner';
        const isTimetable = task.source === 'timetable';

        return (
          <div
            key={key}
            className={[
              'p-3 rounded flex items-center justify-between transition-colors border',
              isDarkMode
                ? 'bg-zinc-900/60 hover:bg-zinc-800 border-zinc-700'
                : 'bg-white/70 hover:bg-white border-black/5',
            ].join(' ')}
          >
            <div className="flex items-center min-w-0">
              <span
                className="inline-block w-3.5 h-3.5 rounded-full mr-2 ring-2 ring-black/10 shrink-0"
                style={{ background: color }}
                title="Task color"
              />
              <div className="min-w-0">
                <div className={isDarkMode ? 'text-xs text-zinc-400' : 'text-xs text-zinc-600'}>
                  {timeStr}
                </div>
                <div className="font-medium truncate">{task.title}</div>
                {task.remarks ? (
                  <div className={isDarkMode ? 'text-xs text-zinc-400 truncate' : 'text-xs text-zinc-500 truncate'}>
                    {task.remarks}
                  </div>
                ) : null}
              </div>
            </div>

            {/* 按鈕：planner 顯示；timetable 隱藏 */}
            <div className="ml-3 shrink-0 flex gap-2">
              {isPlanner && (
                <>
                  <button
                    className={[
                      'px-2 py-1 text-xs rounded border hover:bg-zinc-100 dark:hover:bg-zinc-700',
                      isDarkMode ? 'border-zinc-600' : 'border-zinc-300',
                    ].join(' ')}
                    onClick={() => onEdit?.(task)}
                  >
                    Edit
                  </button>

                  <button
                    className="px-2 py-1 text-xs rounded border border-rose-300 dark:border-rose-600 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                    onClick={() => (onDelete ? onDelete(task) : onDeleteTask?.(task.id))}
                  >
                    Delete
                  </button>
                </>
              )}
              {isTimetable ? null : null}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TaskList;
