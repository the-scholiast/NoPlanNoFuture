import { supabase } from '../supabaseClient';
import { TodoCompletion } from '@/components/todo';
import { TaskData } from '@/types/todoTypes';

export interface CompletedTaskWithDetails extends TaskData {
  completion: TodoCompletion;
  completion_count: number;
}

export const todoCompletionsApi = {
  // Get all completed tasks with their completion details
  async getCompletedTasks(dateRange?: { start: string; end: string }): Promise<CompletedTaskWithDetails[]> {
    let query = supabase
      .from('todo_completions')
      .select(`
        *,
        todos!inner (*)
      `)
      .order('completed_at', { ascending: false });

    if (dateRange) {
      query = query
        .gte('completed_at', dateRange.start)
        .lte('completed_at', dateRange.end);
    }

    if (dateRange) {
      query = query
        .gte('completed_at', dateRange.start)
        .lte('completed_at', dateRange.end);
    }

    const { data: completions, error } = await query;

    if (error) throw error;

    // Group completions by task and add completion count
    const taskCompletionMap = new Map<string, { task: TaskData; completions: TodoCompletion[] }>();

    completions?.forEach((completion: any) => {
      const task = completion.todos;
      const completionRecord = {
        id: completion.id,
        user_id: completion.user_id,
        task_id: completion.task_id,
        instance_date: completion.instance_date,
        completed_at: completion.completed_at,
        created_at: completion.created_at,
      };

      if (!taskCompletionMap.has(task.id)) {
        taskCompletionMap.set(task.id, {
          task,
          completions: []
        });
      }

      taskCompletionMap.get(task.id)!.completions.push(completionRecord);
    });

    // Convert to CompletedTaskWithDetails format
    const result: CompletedTaskWithDetails[] = [];

    taskCompletionMap.forEach(({ task, completions }) => {
      completions.forEach(completion => {
        result.push({
          ...task,
          completion,
          completion_count: completions.length
        });
      });
    });

    return result.sort((a, b) => 
      new Date(b.completion.completed_at).getTime() - new Date(a.completion.completed_at).getTime()
    );
  },

  // Create a new completion record
  async createCompletion(taskId: string, instanceDate: string): Promise<TodoCompletion> {
    const { data, error } = await supabase
      .from('todo_completions')
      .insert({
        task_id: taskId,
        instance_date: instanceDate,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a specific completion
  async deleteCompletion(completionId: string): Promise<void> {
    const { error } = await supabase
      .from('todo_completions')
      .delete()
      .eq('id', completionId);

    if (error) throw error;
  },

  // Get all completions for a specific task
  async getTaskCompletions(taskId: string): Promise<TodoCompletion[]> {
    const { data, error } = await supabase
      .from('todo_completions')
      .select('*')
      .eq('task_id', taskId)
      .order('completed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get completion count for a task
  async getCompletionCount(taskId: string): Promise<number> {
    const { count, error } = await supabase
      .from('todo_completions')
      .select('*', { count: 'exact', head: true })
      .eq('task_id', taskId);

    if (error) throw error;
    return count || 0;
  },

  // Delete all completions for a task (when task is deleted)
  async deleteAllTaskCompletions(taskId: string): Promise<void> {
    const { error } = await supabase
      .from('todo_completions')
      .delete()
      .eq('task_id', taskId);

    if (error) throw error;
  },

  // Get completions within a date range
  async getCompletionsInRange(startDate: string, endDate: string): Promise<CompletedTaskWithDetails[]> {
    return this.getCompletedTasks({ start: startDate, end: endDate });
  },

  // Get completion statistics for a task
  async getTaskCompletionStats(taskId: string): Promise<{
    totalCompletions: number;
    firstCompletion: string | null;
    lastCompletion: string | null;
    completionDates: string[];
  }> {
    const completions = await this.getTaskCompletions(taskId);

    if (completions.length === 0) {
      return {
        totalCompletions: 0,
        firstCompletion: null,
        lastCompletion: null,
        completionDates: []
      };
    }

    const sortedCompletions = completions.sort((a, b) => 
      new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
    );

    return {
      totalCompletions: completions.length,
      firstCompletion: sortedCompletions[0].completed_at,
      lastCompletion: sortedCompletions[sortedCompletions.length - 1].completed_at,
      completionDates: completions.map(c => c.instance_date)
    };
  }
}