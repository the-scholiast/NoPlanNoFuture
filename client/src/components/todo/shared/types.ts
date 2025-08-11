import { TaskData } from '@/types/todoTypes';

export interface TodoSection {
  title: string;
  sectionKey: 'daily' | 'today' | 'upcoming';
  tasks: TaskData[];
}

export interface TodoBoardProps {
  onAddTasks?: (tasks: TaskData[]) => void;
}

// Shared component props
export interface CompletedTasksProps {
  className?: string;
}

// Todo completion record from database
export interface TodoCompletion {
  id: string;
  user_id: string;
  task_id: string;
  instance_date: string;
  completed_at: string;
  created_at: string;
}

// State management for CompletedTasks component
export interface CompletedTasksState {
  expandedTask: string | null;
  isTasksExpanded: boolean;
  sortedCompletedTasks: CompletedTaskWithCompletion[];
  searchQuery: string;
  dateFilter: DateFilterState;
}

// Legacy interface for backward compatibility (if needed)
export interface TaskDisplayData extends TaskData {
  completion_date?: string;
  is_recurring_instance: boolean;
  original_task?: TaskData;
  instance_count?: number;
}

// Task with completion information for display
export interface CompletedTaskWithCompletion extends TaskData {
  completion: TodoCompletion;
  is_recurring_instance: boolean;
  completion_count?: number;
}

// Common filter interfaces
export interface DateFilterState {
  startDate: string;
  endDate: string;
  enabled: boolean;
}

// Helper function types
export type FormatDateFunction = (dateString?: string) => string | null;
export type FormatTimeFunction = (timeString?: string) => string | null;
export type GetSectionLabelFunction = (section: string) => string;
export type GetPriorityColorFunction = (priority: string) => string;

// Mutation result types
export interface MutationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Bulk operation types
export interface BulkDeleteOptions {
  completionIds?: string[];
  taskIds?: string[];
  confirmAction?: boolean;
}

export interface DateRangeFilter {
  startDate: string;
  endDate: string;
  enabled: boolean;
}