export interface Task {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
  section: 'daily' | 'tdoay' | 'upcoming';
  priority?: 'low' | 'medium' | 'high';
  description?: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
}

export interface CreateTaskData {
  title:string;
  section: 'daily' | 'tdoay' | 'upcoming';
  priority?: 'low' | 'medium' | 'high';
  description?: string;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
}