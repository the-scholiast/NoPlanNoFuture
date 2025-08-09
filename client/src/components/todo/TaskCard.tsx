"use client"

import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Repeat, Edit3, Trash2 } from 'lucide-react';
import { TaskData } from '@/types/todoTypes';

interface TaskCardProps {
  task: TaskData;
  isExpanded: boolean;
  onToggle: () => void;
  onExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  formatDate: (dateString?: string) => string | null;
  formatTime: (timeString?: string) => string | null;
  getDateRangeDisplay: (task: TaskData) => string | null;
  getTimeRangeDisplay: (task: TaskData) => string | null;
  isRecurringInstance: (task: TaskData) => boolean;
  getRecurringPatternDisplay: (task: TaskData) => string;
  updateTaskMutationPending?: boolean;
  deleteTaskMutationPending?: boolean;
}

export default function TaskCard({
  task,
  isExpanded,
  onToggle,
  onExpand,
  onEdit,
  onDelete,
  formatDate,
  formatTime,
  getDateRangeDisplay,
  getTimeRangeDisplay,
  isRecurringInstance,
  getRecurringPatternDisplay,
  updateTaskMutationPending = false,
  deleteTaskMutationPending = false,
}: TaskCardProps) {
  const dateRange = getDateRangeDisplay(task);
  const timeRange = getTimeRangeDisplay(task);
  const recurringPattern = getRecurringPatternDisplay(task);
  const isInstance = isRecurringInstance(task);

  return (
    <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
      {/* Checkbox */}
      <button
        onClick={onToggle}
        disabled={updateTaskMutationPending}
        className="flex-shrink-0"
      >
        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
          task.completed
            ? 'bg-primary border-primary text-primary-foreground'
            : 'border-muted-foreground hover:border-primary'
        }`}>
          {task.completed && <span className="text-xs">✓</span>}
        </div>
      </button>

      {/* Task Content */}
      <div className="flex-1 min-w-0">
        {/* Task Title - Clickable to expand/collapse description */}
        <div className="flex items-center gap-2">
          <span
            className={`font-medium text-sm cursor-pointer hover:text-primary transition-colors ${
              task.completed ? 'line-through text-muted-foreground hover:text-muted-foreground/80' : ''
            } ${task.description ? 'select-none' : ''}`}
            onClick={() => task.description && onExpand()}
            title={task.description ? (isExpanded ? "Click to collapse description" : "Click to expand description") : undefined}
          >
            {task.title}
          </span>

          {/* Recurring badge for instances */}
          {isInstance && (
            <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded text-xs">
              Recurring
            </span>
          )}
        </div>

        {/* Task Details Row */}
        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
          {/* Priority */}
          {task.priority && (
            <span className={`px-2 py-0.5 rounded-full font-medium ${
              task.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
            }`}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </span>
          )}

          {/* Date Range */}
          {dateRange && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{dateRange}</span>
            </div>
          )}

          {/* Time Range */}
          {timeRange && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{timeRange}</span>
            </div>
          )}

          {/* Recurring Pattern */}
          {!isInstance && task.is_recurring && recurringPattern && (
            <div className="flex items-center gap-1">
              <Repeat className="w-3 h-3" />
              <span>{recurringPattern}</span>
            </div>
          )}
        </div>

        {/* Description (if expanded) */}
        {isExpanded && task.description && (
          <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted/30 rounded">
            {task.description}
          </p>
        )}
      </div>

      {/* Task Actions - Always visible now */}
      <div className="flex items-center gap-1">
        {/* Edit Task */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="h-6 w-6 p-0"
          title="Edit task"
        >
          <Edit3 className="w-3 h-3" />
        </Button>

        {/* Delete Task */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
          disabled={deleteTaskMutationPending}
          title="Delete task"
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}