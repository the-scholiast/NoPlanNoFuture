"use client"

import React, { useState, useRef } from 'react';
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
import { sortTasksTimeFirst, sortTasksByField } from '../utils/taskSortingUtils';

type SortField = 'start_time' | 'priority' | 'start_date' | 'created_at';
type SortOrder = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  order: SortOrder;
}

export interface CompactTaskSortingProps<T extends TaskData = TaskData> {
  tasks: T[];
  onTasksChange: (sortedTasks: T[]) => void;
  onSortChange?: (field: SortField, order: SortOrder) => void; // ADD this
  className?: string;
  defaultSort?: SortConfig;
}

export const CompactTaskSorting = <T extends TaskData = TaskData>({
  tasks,
  onTasksChange,
  onSortChange,
  className = "",
  defaultSort = { field: 'start_time', order: 'asc' }
}: CompactTaskSortingProps<T>) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>(defaultSort);

  // Simplified sorting logic using shared utilities
  const applySorting = (config: SortConfig) => {
    let sortedTasks: T[];

    if (config.field === 'start_time') {
      // Use the generic time-first logic
      sortedTasks = sortTasksTimeFirst(tasks, config.order);
    } else {
      // Use generic field sorting for other fields
      sortedTasks = sortTasksByField(tasks, config.field, config.order);
    }

    onTasksChange(sortedTasks);
  };

  const handleSortChange = (field: SortField, order?: SortOrder) => {
    const newSortConfig = {
      field,
      order: order || (sortConfig.field === field && sortConfig.order === 'asc' ? 'desc' : 'asc')
    };

    setSortConfig(newSortConfig);

    // If onSortChange prop is provided, use it instead of applySorting
    if (onSortChange) {
      onSortChange(newSortConfig.field, newSortConfig.order);
    } else {
      applySorting(newSortConfig);
    }
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