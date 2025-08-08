"use client"

import React, { useState, } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { TaskData } from '@/types/todoTypes';

type SortField = 'start_time' | 'priority' | 'start_date' | 'created_at';
type SortOrder = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  order: SortOrder;
}

// Compact version without the wrapper div for inline use
export interface CompactTaskSortingProps {
  tasks: TaskData[];
  onTasksChange: (sortedTasks: TaskData[]) => void;
  className?: string;
  defaultSort?: SortConfig;
}

export const CompactTaskSorting: React.FC<CompactTaskSortingProps> = ({
  tasks,
  onTasksChange,
  className = "",
  defaultSort = { field: 'start_time', order: 'asc' }
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>(defaultSort);

  // Reuse the same sorting logic (simplified for space)
  const getPriorityWeight = (priority?: string): number => {
    switch (priority) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 0;
    }
  };

  const getTimeInMinutes = (timeString?: string): number => {
    if (!timeString) return 0;
    const [hours, minutes] = timeString.split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  };

  const getDateObject = (dateString?: string): Date => {
    if (!dateString) return new Date(0);
    return new Date(dateString);
  };

  const getDateTimeComparison = (task1: TaskData, task2: TaskData): number => {
    const date1 = getDateObject(task1.start_date);
    const date2 = getDateObject(task2.start_date);

    if (date1.getTime() !== date2.getTime()) {
      return date1.getTime() - date2.getTime();
    }

    const time1 = getTimeInMinutes(task1.start_time);
    const time2 = getTimeInMinutes(task2.start_time);

    if (time1 !== time2) {
      return time1 - time2;
    }

    const endDate1 = getDateObject(task1.end_date);
    const endDate2 = getDateObject(task2.end_date);

    if (endDate1.getTime() !== endDate2.getTime()) {
      return endDate1.getTime() - endDate2.getTime();
    }

    const endTime1 = getTimeInMinutes(task1.end_time);
    const endTime2 = getTimeInMinutes(task2.end_time);

    return endTime1 - endTime2;
  };

  const handleSortChange = (field: SortField, order?: SortOrder) => {
    const newSortConfig = {
      field,
      order: order || (sortConfig.field === field && sortConfig.order === 'asc' ? 'desc' : 'asc')
    };

    // Update local state immediately
    setSortConfig(newSortConfig);

    // Separate completed and active tasks
    const completedTasks = tasks.filter(task => task.completed);
    const activeTasks = tasks.filter(task => !task.completed);

    // Sort function for both groups
    const sortTaskGroup = (taskGroup: typeof tasks) => {
      return taskGroup.sort((a, b) => {
        let comparison = 0;

        switch (newSortConfig.field) {
          case 'start_time':
            comparison = getTimeInMinutes(a.start_time) - getTimeInMinutes(b.start_time);
            if (comparison === 0) {
              comparison = getDateTimeComparison(a, b);
            }
            break;
          case 'start_date':
            comparison = getDateObject(a.start_date).getTime() - getDateObject(b.start_date).getTime();
            if (comparison === 0) {
              comparison = getDateTimeComparison(a, b);
            }
            break;
          case 'priority':
            comparison = getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
            if (comparison === 0) {
              comparison = getDateTimeComparison(a, b);
            }
            break;
          case 'created_at':
            comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            break;
          default:
            comparison = 0;
        }

        return newSortConfig.order === 'asc' ? comparison : -comparison;
      });
    };

    // Sort both groups and combine with completed tasks at the bottom
    const sortedActiveTasks = sortTaskGroup(activeTasks);
    const sortedCompletedTasks = sortTaskGroup(completedTasks);
    const finalSortedTasks = [...sortedActiveTasks, ...sortedCompletedTasks];

    onTasksChange(finalSortedTasks);
  };

  const formatSortFieldName = (field: SortField): string => {
    switch (field) {
      case 'start_time': return 'Start Time';
      case 'start_date': return 'Start Date';
      case 'priority': return 'Priority';
      case 'created_at': return 'Created';
      default: return field;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={`gap-2 ${className}`}>
          {formatSortFieldName(sortConfig.field)}
          {sortConfig.order === 'asc' ? ' ↑' : ' ↓'}
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Sort Options</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {(['start_time', 'start_date', 'priority', 'created_at'] as SortField[]).map((field) => (
          <React.Fragment key={field}>
            <DropdownMenuItem
              className="flex items-center justify-between cursor-pointer"
              onClick={() => handleSortChange(field, 'asc')}
            >
              <span>{formatSortFieldName(field)} (Ascending)</span>
              {sortConfig.field === field && sortConfig.order === 'asc' && (
                <Check className="w-4 h-4" />
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center justify-between cursor-pointer"
              onClick={() => handleSortChange(field, 'desc')}
            >
              <span>{formatSortFieldName(field)} (Descending)</span>
              {sortConfig.field === field && sortConfig.order === 'desc' && (
                <Check className="w-4 h-4" />
              )}
            </DropdownMenuItem>
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CompactTaskSorting;