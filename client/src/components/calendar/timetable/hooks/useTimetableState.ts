import { useState } from 'react';
import { TaskData } from '@/types/todoTypes';

export const useTimetableState = () => {
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<TaskData | null>(null);
  const [preFilledData, setPreFilledData] = useState<{
    selectedDate?: string;
    selectedTime?: string;
  } | undefined>(undefined);

  return {
    hoveredTaskId,
    setHoveredTaskId,
    editModalOpen,
    setEditModalOpen,
    addModalOpen,
    setAddModalOpen,
    taskToEdit,
    setTaskToEdit,
    preFilledData,
    setPreFilledData
  };
};