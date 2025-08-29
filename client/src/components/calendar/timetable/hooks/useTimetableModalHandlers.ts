import { useEffect } from 'react';
import { TaskData } from '@/types/todoTypes';
import { formatDateString } from '@/lib/utils/dateUtils';

interface UseTimeTableModalHandlersProps {
  editModalOpen: boolean;
  addModalOpen: boolean;
  setTaskToEdit: (task: TaskData | null) => void;
  setEditModalOpen: (open: boolean) => void;
  setAddModalOpen: (open: boolean) => void;
  setPreFilledData: (data: { selectedDate?: string; selectedTime?: string }) => void;
  weekDates: Date[];
  handleDataRefresh: () => void;
}

export const useTimetableModalHandlers = ({
  editModalOpen,
  addModalOpen,
  setTaskToEdit,
  setEditModalOpen,
  setAddModalOpen,
  setPreFilledData,
  weekDates,
  handleDataRefresh
}: UseTimeTableModalHandlersProps) => {

  // Modal close handlers to ensure data refresh
  useEffect(() => {
    if (!editModalOpen && !addModalOpen) {
      const timer = setTimeout(() => {
        handleDataRefresh();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [editModalOpen, addModalOpen, handleDataRefresh]);

  // Handle clicking on a task
  const handleTaskClick = (task: TaskData) => {
    setTaskToEdit(task);
    setEditModalOpen(true);
  };

  // Handle clicking on an empty time slot
  const handleEmptySlotClick = (dayIndex: number, timeSlot: string) => {
    if (!weekDates || weekDates.length === 0) return;

    const selectedDate = formatDateString(weekDates[dayIndex]);
    const selectedTime = timeSlot;

    setPreFilledData({
      selectedDate,
      selectedTime
    });

    setAddModalOpen(true);
  };

  // Handle task updated callback
  const handleTaskUpdated = () => {
    handleDataRefresh();
  };

  // Handle add tasks callback
  const handleAddTasks = async () => {
    handleDataRefresh();
  };

  return {
    handleTaskClick,
    handleEmptySlotClick,
    handleTaskUpdated,
    handleAddTasks
  };
}