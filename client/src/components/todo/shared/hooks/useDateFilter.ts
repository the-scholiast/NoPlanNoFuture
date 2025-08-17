import { useState, useCallback } from 'react';
import { getCurrentWeekStart, getCurrentWeekEnd, DateRangeFilter } from '../';

/**
* Date filter hook for todo app - manages date range filtering state
* Used by CompletedTasks, IncompleteTasks, and DateFilter components
*/
export const useDateFilter = (initialEnabled = true) => {
  // State: date range filter (startDate, endDate, enabled)
  // Default: current week range for typical todo workflow
  const [dateFilter, setDateFilter] = useState<DateRangeFilter>({
    startDate: getCurrentWeekStart(),
    endDate: getCurrentWeekEnd(),
    enabled: initialEnabled
  });

  // Memoized updater function - prevents unnecessary re-renders when passed as prop to DateFilter component
  const updateDateFilter = useCallback((filter: Partial<DateRangeFilter>) => {
    setDateFilter(prev => ({ ...prev, ...filter }));
  }, []);

  return { dateFilter, updateDateFilter, };
};