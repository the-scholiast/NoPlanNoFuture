import { TaskData } from "@/types/todoTypes";
import { apiCall } from "./client";

export interface TimetableTask extends TaskData {
  instance_date?: string; // For recurring task instances
}

export const timetableApi = {
  getScheduledTasks: async (startDate: string, endDate: string): Promise<TimetableTask[]> => {
    return apiCall(`/timetable/tasks?start_date=${startDate}&end_date=${endDate}`)
  },

  getWeekScheduledTasks: async (weekStartDate: string): Promise<TimetableTask[]> => {
    return apiCall(`/timetable/week?week_start=${weekStartDate}`)
  },
}
