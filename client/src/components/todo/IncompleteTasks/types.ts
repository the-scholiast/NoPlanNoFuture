import { TaskData } from '@/types/todoTypes';

// Helper function types (matching the shared types pattern)
export type FormatDateFunction = (dateString?: string) => string | null;
export type FormatTimeFunction = (timeString?: string) => string | null;
export type GetSectionLabelFunction = (section: string) => string;
export type GetPriorityColorFunction = (priority: string) => string;

// Props for the IncompleteTasks component
export interface IncompleteTasksProps {
  className?: string;
}

// Task with incomplete/overdue information for display
export interface IncompleteTaskWithOverdue extends TaskData {
  overdueDays: number;
  is_incomplete: boolean;
}

// Props for individual IncompleteTaskItem component
export interface IncompleteTaskItemProps {
  task: IncompleteTaskWithOverdue;
  isExpanded: boolean;
  onToggleExpansion: (taskId: string) => void;
  onCompleteTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  formatDate: FormatDateFunction;
  formatTime: FormatTimeFunction;
  getSectionLabel: GetSectionLabelFunction;
  getPriorityColor: GetPriorityColorFunction;
}

// State management for IncompleteTasks component
export interface IncompleteTasksState {
  expandedTask: string | null;
  isTasksExpanded: boolean;
  sortedIncompleteTasks: IncompleteTaskWithOverdue[];
  searchQuery: string;
  dateFilter: {
    startDate: string;
    endDate: string;
    enabled: boolean;
  };
}

// Filter options specific to incomplete tasks
export interface IncompleteTaskFilter {
  showOverdueOnly: boolean;
  minOverdueDays: number;
  maxOverdueDays: number;
}

// Sort options for incomplete tasks
export interface IncompleteTaskSort {
  field: 'overdueDays' | 'start_date' | 'end_date' | 'created_at' | 'priority' | 'title';
  order: 'asc' | 'desc';
}

// Mutation result types
export interface IncompleteTaskMutationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Bulk operation types for incomplete tasks
export interface BulkIncompleteTaskOptions {
  taskIds: string[];
  action: 'complete' | 'delete' | 'update_dates';
  confirmAction?: boolean;
}