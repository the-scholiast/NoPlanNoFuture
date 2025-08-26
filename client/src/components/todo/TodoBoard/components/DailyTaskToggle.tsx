"use client"

import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar, CalendarDays } from 'lucide-react';

interface DailyTaskToggleProps {
  showAllTasks: boolean;
  onToggle: (showAll: boolean) => void;
  className?: string;
}

export const DailyTaskToggle: React.FC<DailyTaskToggleProps> = ({
  showAllTasks,
  onToggle,
  className = ""
}) => {
  return (
    <div className={`flex border rounded-md ${className}`}>
      <Button
        variant={!showAllTasks ? "default" : "ghost"}
        size="sm"
        onClick={() => onToggle(false)}
        className="rounded-r-none border-r h-8 px-2"
      >
        <Calendar className="h-3 w-3 mr-1" />
        Today
      </Button>
      <Button
        variant={showAllTasks ? "default" : "ghost"}
        size="sm"
        onClick={() => onToggle(true)}
        className="rounded-l-none h-8 px-2"
      >
        <CalendarDays className="h-3 w-3 mr-1" />
        All
      </Button>
    </div>
  );
};

export default DailyTaskToggle;