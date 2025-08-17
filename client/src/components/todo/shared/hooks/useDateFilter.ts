import { useState, useMemo, useCallback } from 'react';
import { DateRangeFilter } from '../types';
import { getCurrentWeekStart, getCurrentWeekEnd } from '../utils';
import { getTodayString } from '@/lib/utils/dateUtils';

export const useDateFilter = (initialEnabled = true) => {
  const [dateFilter, setDateFilter] = useState<DateRangeFilter>({
    startDate: getCurrentWeekStart(),
    endDate: getCurrentWeekEnd(),
    enabled: initialEnabled
  });

  // Date helpers
  const today = useMemo(() => getTodayString(), []);

  const currentWeek = useMemo(() => ({
    start: getCurrentWeekStart(),
    end: getCurrentWeekEnd()
  }), []);

  const currentMonth = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    return {
      start: `${firstDay.getFullYear()}-${String(firstDay.getMonth() + 1).padStart(2, '0')}-${String(firstDay.getDate()).padStart(2, '0')}`,
      end: `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`
    };
  }, []);

  const updateDateFilter = useCallback((filter: Partial<DateRangeFilter>) => {
    setDateFilter(prev => ({ ...prev, ...filter }));
  }, []);

  const handleDateFilterChange = useCallback((field: 'startDate' | 'endDate', value: string) => {
    updateDateFilter({ [field]: value });
  }, [updateDateFilter]);

  const toggleDateFilter = useCallback(() => {
    updateDateFilter({ enabled: !dateFilter.enabled });
  }, [updateDateFilter, dateFilter.enabled]);

  const resetDateFilter = useCallback(() => {
    updateDateFilter({
      startDate: today,
      endDate: today,
      enabled: true
    });
  }, [updateDateFilter, today]);

  const setWeekFilter = useCallback(() => {
    updateDateFilter({
      startDate: currentWeek.start,
      endDate: currentWeek.end,
      enabled: true
    });
  }, [updateDateFilter, currentWeek]);

  const setMonthFilter = useCallback(() => {
    updateDateFilter({
      startDate: currentMonth.start,
      endDate: currentMonth.end,
      enabled: true
    });
  }, [updateDateFilter, currentMonth]);

  const clearDateFilter = useCallback(() => {
    updateDateFilter({ enabled: false });
  }, [updateDateFilter]);

  const getFilterDisplayText = useCallback(() => {
    if (!dateFilter.enabled) return 'All dates';

    const formatLocalDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString();
    };

    if (dateFilter.startDate === dateFilter.endDate && dateFilter.startDate === today) {
      return 'Today only';
    }

    if (dateFilter.startDate === currentWeek.start && dateFilter.endDate === currentWeek.end) {
      return 'This week';
    }

    if (dateFilter.startDate === currentMonth.start && dateFilter.endDate === currentMonth.end) {
      return 'This month';
    }

    if (dateFilter.startDate === dateFilter.endDate) {
      return formatLocalDate(dateFilter.startDate);
    }

    return `${formatLocalDate(dateFilter.startDate)} - ${formatLocalDate(dateFilter.endDate)}`;
  }, [dateFilter, today, currentWeek, currentMonth]);

  return {
    dateFilter,
    updateDateFilter,
    handleDateFilterChange,
    toggleDateFilter,
    resetDateFilter,
    setWeekFilter,
    setMonthFilter,
    clearDateFilter,
    getFilterDisplayText,
  };
};