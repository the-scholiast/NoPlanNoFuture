import React from 'react';
import { Calendar, Clock, RotateCcw, Trash2, AlertCircle, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IncompleteTaskItemProps } from './types';

export const IncompleteTaskItem: React.FC<IncompleteTaskItemProps> = ({
  task,
  isExpanded,
  onToggleExpansion,
  onCompleteTask,
  onDeleteTask,
  formatDate,
  formatTime,
  getSectionLabel,
  getPriorityColor,
}) => {
  const getOverdueColor = (overdueDays: number) => {
    if (overdueDays <= 0) return 'bg-gray-100 text-gray-800 border-gray-200';
    if (overdueDays <= 3) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (overdueDays <= 7) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
      {/* Incomplete Indicator */}
      <div className="w-5 h-5 bg-orange-500 border-2 border-orange-500 rounded flex items-center justify-center mt-0.5">
        <AlertCircle className="w-3 h-3 text-white" />
      </div>

      {/* Task Content */}
      <div className="flex-1 min-w-0">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div
              className="text-sm font-medium cursor-pointer text-foreground flex items-center gap-2"
              onClick={() => onToggleExpansion(task.id)}
            >
              <span>{task.title}</span>

              {/* Overdue badge */}
              {task.overdueDays > 0 && (
                <Badge className={getOverdueColor(task.overdueDays)}>
                  {task.overdueDays} day{task.overdueDays > 1 ? 's' : ''} overdue
                </Badge>
              )}

              {/* Recurring task indicators */}
              {task.is_recurring && (
                <div title="Recurring task">
                  <Repeat className="h-3 w-3 text-blue-500" />
                </div>
              )}

              {/* Completion count for recurring tasks */}
              {task.completion_count && task.completion_count > 0 && (
                <Badge variant="outline" className="text-xs">
                  {task.completion_count} completions
                </Badge>
              )}
            </div>

            {/* Task Description - Shows inline next to title */}
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

          {/* Overdue Status */}
          <div className="text-xs text-muted-foreground">
            {task.overdueDays > 0 ? (
              <div>
                <strong>Overdue by:</strong> {task.overdueDays} day{task.overdueDays > 1 ? 's' : ''}
                {task.end_date && (
                  <span className="ml-2">
                    (Due: {formatDate(task.end_date)})
                  </span>
                )}
              </div>
            ) : (
              <div>
                <strong>Due:</strong> {formatDate(task.end_date || task.start_date)}
              </div>
            )}
          </div>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="mt-3 p-3 bg-muted/20 rounded border text-xs space-y-2">
              <div>
                <strong>Task Details:</strong>
                <div className="ml-2">
                  <div>Task ID: {task.id}</div>
                  <div>Created: {formatDate(task.created_at?.split('T')[0])}</div>
                  {task.is_recurring && task.recurring_days && (
                    <div>Recurs on: {task.recurring_days.join(', ')}</div>
                  )}
                  <div>Section: {getSectionLabel(task.section || 'other')}</div>
                  {task.priority && <div>Priority: {task.priority}</div>}
                </div>
              </div>

              <div>
                <strong>Due Information:</strong>
                <div className="ml-2">
                  {task.start_date && <div>Start Date: {task.start_date}</div>}
                  {task.end_date && <div>End Date: {task.end_date}</div>}
                  {task.start_time && <div>Start Time: {formatTime(task.start_time)}</div>}
                  {task.end_time && <div>End Time: {formatTime(task.end_time)}</div>}
                  {task.overdueDays > 0 && (
                    <div className="text-orange-600 font-medium">
                      Overdue by {task.overdueDays} day{task.overdueDays > 1 ? 's' : ''}
                    </div>
                  )}
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
          onClick={() => onCompleteTask(task.id)}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-green-600"
          title="Mark as complete"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDeleteTask(task.id)}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          title="Delete task"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};