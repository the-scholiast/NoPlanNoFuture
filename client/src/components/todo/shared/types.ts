import { TaskData } from '@/types/todoTypes';

export interface TodoSection {
  title: string;
  sectionKey: 'daily' | 'today' | 'upcoming';
  tasks: TaskData[];
  showAddButton: boolean;
}

export interface TodoBoardProps {
  onAddTasks?: (tasks: TaskData[]) => void;
}