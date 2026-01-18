'use client'

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { TaskData } from '@/types/todoTypes';
import { getTodayString } from '@/lib/utils/dateUtils';
import { todoApi } from '@/lib/api/todos';
import { recurringTodoApi } from '@/lib/api/recurringTodosApi';
import { todoKeys } from '@/lib/queryKeys';
import { filterDailyTasksByDate, getTimeRangeDisplay } from '@/components/todo/shared';
import { getTimeInMinutes } from '@/components/todo';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { AddTaskModal } from '@/components/todo';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { User as UserIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const tasksOverlap = (task1: TaskData, task2: TaskData): boolean => {
  if (!task1.start_time || !task1.end_time || !task2.start_time || !task2.end_time) {
    return false;
  }

  const task1Start = getTimeInMinutes(task1.start_time);
  const task1End = getTimeInMinutes(task1.end_time);
  const task2Start = getTimeInMinutes(task2.start_time);
  const task2End = getTimeInMinutes(task2.end_time);

  return task1Start < task2End && task2Start < task1End;
};

const groupOverlappingTasks = (tasks: TaskData[]): TaskData[][] => {
  const groups: TaskData[][] = [];
  const processed = new Set<string>();

  for (const task of tasks) {
    if (processed.has(task.id)) continue;

    const group: TaskData[] = [task];
    processed.add(task.id);
    const toCheck = [task];

    while (toCheck.length > 0) {
      const currentTask = toCheck.pop()!;
      
      for (const otherTask of tasks) {
        if (processed.has(otherTask.id)) continue;
        if (tasksOverlap(currentTask, otherTask)) {
          group.push(otherTask);
          processed.add(otherTask.id);
          toCheck.push(otherTask);
        }
      }
    }

    groups.push(group);
  }

  return groups;
};

export default function MobilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const today = useMemo(() => getTodayString(), []);

  // Redirect to homepage if user is not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const handleAddTasks = (tasks: TaskData[]) => {
    console.log('Tasks added:', tasks);
  };

  const { data: allTasks = [], isLoading: isLoadingAll } = useQuery({
    queryKey: todoKeys.all,
    queryFn: todoApi.getAll,
    refetchOnWindowFocus: true,
  });

  const { data: todayTasksWithRecurring = [], isLoading: isLoadingToday } = useQuery({
    queryKey: todoKeys.today,
    queryFn: recurringTodoApi.getTodayTasks,
    refetchOnWindowFocus: true,
  });

  const dailyTasks = useMemo(() =>
    allTasks.filter(task => task.section === 'daily'),
    [allTasks]
  );

  const filteredDailyTasks = useMemo(() => {
    return filterDailyTasksByDate(dailyTasks, today, false);
  }, [dailyTasks, today]);

  const todayTasks = useMemo(() => {
    const nonDailyTodayTasks = todayTasksWithRecurring.filter(task => task.section !== 'daily' && task.section !== 'none');
    
    const scheduledTasksFromAll = allTasks.filter(task => {
      if (task.section !== 'none' || !task.is_schedule) return false;
      if (!task.start_date) return false;
      const taskDate = task.start_date.includes('T') ? task.start_date.split('T')[0] : task.start_date;
      return taskDate === today;
    });
    
    const allTodayTasks: TaskData[] = [
      ...filteredDailyTasks,
      ...nonDailyTodayTasks,
      ...scheduledTasksFromAll
    ];

    return allTodayTasks.sort((a, b) => {
      if (a.start_time && b.start_time) {
        return a.start_time.localeCompare(b.start_time);
      }
      if (a.start_time && !b.start_time) return -1;
      if (!a.start_time && b.start_time) return 1;
      return 0;
    });
  }, [filteredDailyTasks, todayTasksWithRecurring, allTasks, today]);

  const taskGroups = useMemo(() => {
    return groupOverlappingTasks(todayTasks);
  }, [todayTasks]);

  const formatDateDisplay = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  const isLoading = isLoadingAll || isLoadingToday;

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Don't render content if user is not authenticated (will redirect)
  if (!user) {
    return null;
  }

  const headerContent = (
    <div className="mb-4 pb-3 border-b">
      <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 pb-5 ">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/favicon.ico" alt="No Plan No Future" />
              <AvatarFallback>
                <UserIcon className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium ">No Plan No Future</span>
          </div>
      </div>
      <div className="text-base font-semibold text-center">{formatDateDisplay(today)}</div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-muted-foreground">Loading tasks...</div>
      </div>
    );
  }

  if (todayTasks.length === 0) {
    return (
      <div className="min-h-screen bg-background p-4 pb-20">
        {headerContent}
        <div className="flex items-center justify-center h-[calc(100vh-120px)]">
          <div className="text-center text-muted-foreground text-lg">No task</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background p-4 pb-20">
        {headerContent}
        <div className="space-y-2">
          {taskGroups.map((group, groupIndex) => {
            const hasOverlapping = group.length > 1;
            const width = hasOverlapping ? '50%' : '100%';

            return (
              <div key={groupIndex} className={hasOverlapping ? 'flex gap-2' : ''}>
                {group.map((task) => (
                  <div
                    key={task.id}
                    className="rounded-md border p-3 bg-card"
                    style={{ width }}
                  >
                    <div className="font-medium text-sm mb-1">{task.title}</div>
                    {task.start_time && task.end_time && (
                      <div className="text-xs text-muted-foreground">
                        {getTimeRangeDisplay(task)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
      <div className="fixed bottom-4 left-4 right-4">
        <Button
          className="w-full h-12 rounded-full shadow-lg"
          size="lg"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus className="h-5 w-5 mr-2" />
          Add Task
        </Button>
      </div>
      <AddTaskModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onAddTasks={handleAddTasks}
        preFilledData={{ selectedDate: today }}
      />
    </>
  );
}
