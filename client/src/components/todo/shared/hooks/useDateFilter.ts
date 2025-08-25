import { useState, useCallback } from 'react';
import { getCurrentWeekStart, getCurrentWeekEnd, DateRangeFilter, getLast7DaysStart, getLast7DaysEnd } from '../';

/**
* Date filter hook for todo app - manages date range filtering state
* Used by CompletedTasks and DateFilter components
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

/**
 * Date filter hook for incomplete tasks - uses last 7 days instead of Monday-Sunday week
 * Used specifically by IncompleteTasks component
 */
export const useDateFilterLast7Days = (initialEnabled = true) => {
  // State: date range filter for last 7 days
  const [dateFilter, setDateFilter] = useState<DateRangeFilter>({
    startDate: getLast7DaysStart(),
    endDate: getLast7DaysEnd(),
    enabled: initialEnabled
  });

  // Memoized updater function
  const updateDateFilter = useCallback((filter: Partial<DateRangeFilter>) => {
    setDateFilter(prev => ({ ...prev, ...filter }));
  }, []);

  return { dateFilter, updateDateFilter };
};