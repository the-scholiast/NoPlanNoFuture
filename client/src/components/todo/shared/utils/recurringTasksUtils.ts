export const isRecurringInstance = (task: { id: string; parent_task_id?: string }): boolean => {
  return task.id.includes('_') && !!task.parent_task_id;
};

// Extract original task ID from completion or instance ID
export const getOriginalTaskId = (id: string): string => {
  if (id.includes('_instance_')) {
    return id.split('_instance_')[0];
  }
  if (id.includes('_')) {
    return id.split('_')[0];
  }
  return id;
};

// Calculate the date for a recurring task instance (simplified approach -> need to track each specific completion date)
export const calculateInstanceDate = (task: any, instanceIndex: number): string => {
  if (task.last_completed_date) {
    const lastCompleted = new Date(task.last_completed_date);
    const daysBack = instanceIndex;
    const instanceDate = new Date(lastCompleted);
    instanceDate.setDate(lastCompleted.getDate() - daysBack);
    return instanceDate.toISOString().split('T')[0];
  }

  const created = new Date(task.created_at);
  created.setDate(created.getDate() + instanceIndex);
  return created.toISOString().split('T')[0];
};

// Create recurring task instances for completed tasks
export const createRecurringTaskInstances = (task: any, completionCount?: number): any[] => {
  const instances: any[] = [];
  const count = completionCount || task.completion_count || 0;

  if (count > 0) {
    for (let i = 0; i < count; i++) {
      const instanceDate = calculateInstanceDate(task, i);
      instances.push({
        ...task,
        id: `${task.id}_instance_${i}`,
        completion_date: instanceDate,
        is_recurring_instance: true,
        original_task: task,
        instance_count: i + 1
      });
    }
  }

  return instances;
};

