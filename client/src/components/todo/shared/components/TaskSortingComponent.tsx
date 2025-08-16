"use client"

import React, { useState, useRef} from 'react';
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
    const lastTasksRef = useRef<string>('');
  const lastSortConfigRef = useRef<string>('');

  // Simplified sorting logic using shared utilities
  const applySorting = (config: SortConfig) => {
    let sortedTasks: TaskData[];

    if (config.field === 'start_time') {
      // Use the same time-first logic as Daily section
      sortedTasks = sortTasksTimeFirst([...tasks], config.order);
    } else {
      // Use generic field sorting for other fields
      sortedTasks = sortTasksByField([...tasks], config.field, config.order);
    }

    onTasksChange(sortedTasks);
  };

  // Apply sorting when needed
  React.useEffect(() => {
    const tasksSignature = tasks.map(t => `${t.id}-${t.completed}-${t.start_time}-${t.priority}`).join('|');
    const sortConfigSignature = `${sortConfig.field}-${sortConfig.order}`;

    // Only apply sorting if something actually changed
    if (tasks.length > 0 && 
        (tasksSignature !== lastTasksRef.current || sortConfigSignature !== lastSortConfigRef.current)) {
      lastTasksRef.current = tasksSignature;
      lastSortConfigRef.current = sortConfigSignature;
      applySorting(sortConfig);
    }
  }, [tasks, sortConfig.field, sortConfig.order]);

  const handleSortChange = (field: SortField, order?: SortOrder) => {
    const newSortConfig = {
      field,
      order: order || (sortConfig.field === field && sortConfig.order === 'asc' ? 'desc' : 'asc')
    };

    setSortConfig(newSortConfig);
    applySorting(newSortConfig);
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