import { TaskData } from '@/types/todoTypes';
import { FormatDateFunction, FormatTimeFunction, GetSectionLabelFunction, GetPriorityColorFunction } from '../shared/types';

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