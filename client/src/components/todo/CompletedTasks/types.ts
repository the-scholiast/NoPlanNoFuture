import { CompletedTaskWithCompletion } from '..';

export interface CompletedTasksProps {
  className?: string;
}

export interface CompletedTaskItemProps {
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