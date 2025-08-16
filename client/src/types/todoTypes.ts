export interface TaskData {
  updated_at: string;
  id: string;
  title: string;
  completed: boolean;
  completed_at?: string;
  created_at: string;
  section: 'daily' | 'today' | 'upcoming' | 'none';
  priority?: 'low' | 'medium' | 'high';
  description?: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  is_recurring?: boolean;
  recurring_days?: string[]; // ['monday','tuesday', etc]
  parent_task_id?: string;
  completion_count?: number;
  last_completed_date?: string;
  deleted_at?: string;
  is_schedule?: boolean;
}

export interface CreateTaskData {
  title: string;
  section: 'daily' | 'today' | 'upcoming' | 'none';
  priority?: 'low' | 'medium' | 'high';
  description?: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  is_recurring?: boolean;
  recurring_days?: string[];
  is_schedule?: boolean;
}

export interface AddTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTasks: (tasks: TaskData[]) => void;
  preFilledData?: {
    selectedDate?: string; 
    selectedTime?: string; 
  };
}

export interface InternalTaskData {
  id: string;
  title: string;
  section: 'daily' | 'today' | 'upcoming' | 'none';
  priority?: 'low' | 'medium' | 'high';
  description?: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  is_recurring?: boolean;
  recurring_days?: string[];
  is_schedule?: boolean;
}

export interface EditTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: TaskData | null;
  onTaskUpdated: () => void;
}