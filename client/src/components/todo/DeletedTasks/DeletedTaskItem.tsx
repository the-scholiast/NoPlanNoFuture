import React from 'react';
import { Calendar, Clock, RotateCcw, Trash2, Archive, Repeat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DeletedTaskItemProps } from './types';
import { formatDate } from '../shared/utils';

export const DeletedTaskItem: React.FC<DeletedTaskItemProps> = ({
  task,
  isExpanded,
  onToggleExpansion,
  onRestoreTask,
  onPermanentDeleteTask,
  formatTime,
  getSectionLabel,
  getPriorityColor,
}) => {
  const getDeletedColor = (deletedDays: number) => {
    if (deletedDays <= 7) return 'bg-gray-100 text-gray-800 border-gray-200';
    if (deletedDays <= 14) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (deletedDays <= 30) return 'bg-orange-100 text-orange-800 border-orange-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };
  const deletedDate = formatDate(task.deleted_at?.split('T')[0] || task.deleted_at);

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
      {/* Deleted Indicator */}
      <div className="w-5 h-5 bg-gray-500 border-2 border-gray-500 rounded flex items-center justify-center mt-0.5">
        <Archive className="w-3 h-3 text-white" />
      </div>

      {/* Task Content */}
      <div className="flex-1 min-w-0">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div
              className="text-sm font-medium cursor-pointer text-foreground/70 flex items-center gap-2"
              onClick={() => onToggleExpansion(task.id)}
            >
              <span>{task.title}</span>

              {/* Deleted badge */}
              {task.deletedDays >= 0 && (
                <Badge className={getDeletedColor(task.deletedDays)}>
                  {task.deletedDays === 0 ? 'Today' : `${task.deletedDays} day${task.deletedDays > 1 ? 's' : ''} ago`}
                </Badge>
              )}

              {/* Recurring task indicators */}
              {task.is_recurring && (
                <div title="Recurring task">
                  <Repeat className="h-3 w-3 text-blue-500/50" />
                </div>
              )}
            </div>
          </div>

          {/* Additional Info */}
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
          <div className="text-xs text-muted-foreground space-y-1">
            {task.deleted_at && (
              <div>
                <strong>Deleted:</strong> {deletedDate}
              </div>
            )}
          </div>

          {/* Expanded Details */}
          {task.description && isExpanded && (
            <div className="mt-3 p-3 bg-muted/20 rounded border text-xs space-y-2">
              <div>
                <strong>Description:</strong> {task.description}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRestoreTask(task.id)}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-green-600"
          title="Restore task"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onPermanentDeleteTask(task.id)}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
          title="Permanently delete"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};