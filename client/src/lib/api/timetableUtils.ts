/**
 * Timetable utility functions for API routes
 */
import supabase from '../supabaseAdmin';
import { formatDateString, ensureLocalDate, shouldTaskAppearOnDate } from './dateUtils';

// Get all scheduled tasks (is_schedule = true) for a date range
export const getScheduledTasksForDateRange = async (
  userId: string,
  startDate: string,
  endDate: string
) => {
  // Get regular scheduled tasks (non-recurring)
  const { data: regularTasks, error: regularError } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .eq('is_schedule', true)
    .eq('is_recurring', false)
    .is('deleted_at', null)
    .not('start_time', 'is', null)
    .not('end_time', 'is', null)
    .gte('start_date', startDate)
    .lte('start_date', endDate)
    .order('start_date', { ascending: true })
    .order('start_time', { ascending: true });

  if (regularError) throw regularError;

  // Get recurring scheduled tasks
  const { data: recurringTasks, error: recurringError } = await supabase
    .from('todos')
    .select('*')
    .eq('user_id', userId)
    .eq('is_schedule', true)
    .eq('is_recurring', true)
    .is('deleted_at', null)
    .not('start_time', 'is', null)
    .not('end_time', 'is', null)
    .not('recurring_days', 'is', null);

  if (recurringError) throw recurringError;

  // Generate instances for recurring tasks
  const recurringInstances: any[] = [];
  const startDateObj = ensureLocalDate(startDate);
  const endDateObj = ensureLocalDate(endDate);

  for (const task of recurringTasks || []) {
    const currentDate = new Date(startDateObj);

    while (currentDate <= endDateObj) {
      if (shouldTaskAppearOnDate(task, currentDate)) {
        const currentDateString = formatDateString(currentDate);
        recurringInstances.push({
          ...task,
          id: `${task.id}_${currentDateString}`,
          instance_date: currentDateString,
          start_date: currentDateString,
          parent_task_id: task.id
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  // Get task overrides for recurring instances
  const instanceDates = recurringInstances.map(inst => inst.instance_date);
  if (instanceDates.length > 0) {
    const { data: overrides } = await supabase
      .from('todo_overrides')
      .select('*')
      .eq('user_id', userId)
      .in('instance_date', instanceDates);

    // Apply overrides to instances
    if (overrides) {
      for (const instance of recurringInstances) {
        const override = overrides.find(
          (o: any) => o.parent_task_id === instance.parent_task_id && o.instance_date === instance.instance_date
        );
        if (override) {
          Object.assign(instance, {
            title: override.title ?? instance.title,
            description: override.description ?? instance.description,
            start_time: override.start_time ?? instance.start_time,
            end_time: override.end_time ?? instance.end_time,
            priority: override.priority ?? instance.priority,
            is_completed: override.is_completed ?? instance.is_completed,
          });
        }
      }
    }
  }

  // Combine and sort all tasks
  const allTasks = [...(regularTasks || []), ...recurringInstances];

  // Sort by date and time
  allTasks.sort((a, b) => {
    const dateA = a.start_date || a.instance_date;
    const dateB = b.start_date || b.instance_date;

    if (dateA !== dateB) {
      return dateA.localeCompare(dateB);
    }

    const timeA = a.start_time || '00:00';
    const timeB = b.start_time || '00:00';
    return timeA.localeCompare(timeB);
  });

  return allTasks;
};

