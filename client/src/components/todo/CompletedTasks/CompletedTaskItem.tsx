import React from 'react';
import { Check, Trash2, RotateCcw, Calendar, Clock, Repeat, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CompletedTaskWithCompletion } from './types';

interface CompletedTaskItemProps {
  task: CompletedTaskWithCompletion;
  isExpanded: boolean;
  onToggleExpansion: (completionId: string) => void;
  onUncompleteTask: (completionId: string) => void;
  onDeleteTask: (taskId: string) => void;
  formatDate: (dateString?: string) => string | null;
  formatTime: (timeString?: string) => string | null;
  getSectionLabel: (section: string) => string;
  getPriorityColor: (priority: string) => string;
}

export function CompletedTaskItem({
  task,
  isExpanded,
  onToggleExpansion,
  onUncompleteTask,
  onDeleteTask,
  formatDate,
  formatTime,
  getSectionLabel,
  getPriorityColor,
}: CompletedTaskItemProps) {
  const completionDate = formatDate(task.completion.instance_date);

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
      {/* Completion Indicator */}
      <div className="w-5 h-5 bg-green-500 border-2 border-green-500 rounded flex items-center justify-center mt-0.5">
        <Check className="w-3 h-3 text-white" />
      </div>

      {/* Task Content */}
      <div className="flex-1 min-w-0">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div
              className="text-sm font-medium cursor-pointer line-through text-muted-foreground flex items-center gap-2"
              onClick={() => onToggleExpansion(task.completion.id)}
            >
              <span>{task.title}</span>

              {/* Recurring task indicators */}
              {task.is_recurring && (
                <div title="Recurring task">
                  <Repeat className="h-3 w-3 text-blue-500" />
                </div>
              )}
              {task.is_recurring_instance && (
                <div title="Task instance">
                  <AlertCircle className="h-3 w-3 text-orange-500" />
                </div>
              )}

              {/* Completion count for recurring tasks */}
              {task.completion_count && task.completion_count > 1 && (
                <Badge variant="outline" className="text-xs">
                  {task.completion_count} completions
                </Badge>
              )}
            </div>

            {/* Task Description - Shows inline next to title without strikethrough */}
            {task.description && (
              <span className="text-xs font-normal text-muted-foreground/80">
                - {task.description}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
            {/* Priority Badge */}
            {task.priority && (
              <span className={`px-2 py-0.5 rounded-full font-medium ${getPriorityColor(task.priority)}`}>
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </span>
            )}

            {/* Section Badge */}
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 font-medium">
              {getSectionLabel(task.section || 'other')}
            </span>

            {/* Original task dates */}
            {(task.start_date || task.end_date) && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(task.start_date)}
                {task.start_date && task.end_date && task.end_date !== task.start_date && ` - ${formatDate(task.end_date)}`}
              </div>
            )}

            {/* Original task times */}
            {(task.start_time || task.end_time) && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(task.start_time)}
                {task.start_time && task.end_time && ` - ${formatTime(task.end_time)}`}
              </div>
            )}
          </div>

          {/* Completion Status */}
          <div className="text-xs text-muted-foreground">
            <strong>Completed on:</strong> {completionDate}
          </div>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="mt-3 p-3 bg-muted/20 rounded border text-xs space-y-2">
              <div>
                <strong>Task Details:</strong>
                <div className="ml-2">
                  <div>Task ID: {task.id}</div>
                  <div>Completion ID: {task.completion.id}</div>
                  <div>Created: {formatDate(task.created_at.split('T')[0])}</div>
                  {task.is_recurring && task.recurring_days && (
                    <div>Recurs on: {task.recurring_days.join(', ')}</div>
                  )}
                </div>
              </div>

              <div>
                <strong>Completion Details:</strong>
                <div className="ml-2">
                  <div>Instance Date: {task.completion.instance_date}</div>
                  <div>Completed At: {new Date(task.completion.completed_at).toLocaleString()}</div>
                  <div>Total Completions for this task: {task.completion_count || 1}</div>
                </div>
              </div>

              {task.description && (
                <div>
                  <strong>Description:</strong> {task.description}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onUncompleteTask(task.completion.id)}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
          title="Remove this completion"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDeleteTask(task.id)}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          title="Delete entire task"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}