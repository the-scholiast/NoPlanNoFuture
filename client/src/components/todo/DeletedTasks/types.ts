import { TaskData } from '@/types/todoTypes';
import { FormatDateFunction, FormatTimeFunction, GetSectionLabelFunction, GetPriorityColorFunction } from '../shared/types';

// Props for the DeletedTasks component
export interface DeletedTasksProps {
  className?: string;
}

// Task with deleted information for display
export interface DeletedTaskWithInfo extends TaskData {
  deletedDays: number;
  is_deleted: boolean;
}

// Props for individual DeletedTaskItem component
export interface DeletedTaskItemProps {
  task: DeletedTaskWithInfo;
  isExpanded: boolean;
  onToggleExpansion: (taskId: string) => void;
  onRestoreTask: (taskId: string) => void;
  onPermanentDeleteTask: (taskId: string) => void;
  formatDate: FormatDateFunction;
  formatTime: FormatTimeFunction;
  getSectionLabel: GetSectionLabelFunction;
  getPriorityColor: GetPriorityColorFunction;
}