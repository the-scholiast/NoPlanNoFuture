import { TaskData } from '@/types/todoTypes';
import { 
  TodoCompletion, 
  CompletedTaskWithCompletion, 
  CompletedTasksState,
  DateFilterState 
} from '../shared/types';

export interface CompletedTasksProps {
  className?: string;
}

// Re-export shared types for convenience
export type { 
  TodoCompletion, 
  CompletedTaskWithCompletion, 
  CompletedTasksState,
  DateFilterState 
};

export interface CompletedTaskInstance {
  id: string; // completion.id
  task_id: string; // completion.task_id
  completion_id: string; // completion.id
  instance_date: string; // completion.instance_date
  completed_at: string; // completion.completed_at
  task_data: TaskData;
  is_instance: boolean;
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