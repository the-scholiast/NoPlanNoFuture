'use client'

import React, { useState, useMemo } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface UpcomingDateFilterProps {
  onFilterChange: (filter: {
    startDate: string;
    endDate: string;
    enabled: boolean;
  }) => void;
  className?: string;
}

export default function UpcomingDateFilter({ onFilterChange, className = '' }: UpcomingDateFilterProps) {
  // Get current date + 1 (tomorrow) as the minimum selectable date
  const tomorrow = useMemo(() => {
    const now = new Date();
    now.setDate(now.getDate() + 1);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Get current week starting from tomorrow (Monday to Sunday)
  const upcomingWeek = useMemo(() => {
    const now = new Date();
    now.setDate(now.getDate() + 1); // Start from tomorrow
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday to 6, others to dayOfWeek - 1

    const monday = new Date(now);
    monday.setDate(now.getDate() - daysFromMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return {
      start: formatDate(monday),
      end: formatDate(sunday)
    };
  }, []);

  // Get current month starting from tomorrow
  const upcomingMonth = useMemo(() => {
    const now = new Date();
    now.setDate(now.getDate() + 1); // Start from tomorrow
    const year = now.getFullYear();
    const month = now.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Ensure we don't go before tomorrow
    const startDate = firstDay < new Date(tomorrow) ? tomorrow : formatDate(firstDay);

    return {
      start: startDate,
      end: formatDate(lastDay)
    };
  }, [tomorrow]);

  // Default to "This Week" for upcoming tasks
  const [dateFilter, setDateFilter] = useState({
    startDate: upcomingWeek.start,
    endDate: upcomingWeek.end,
    enabled: true
  });

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Notify parent component of filter changes
  React.useEffect(() => {
    onFilterChange(dateFilter);
  }, [dateFilter, onFilterChange]);

  const handleDateFilterChange = (field: 'startDate' | 'endDate', value: string) => {
    // Ensure the date is not before tomorrow
    const selectedDate = value < tomorrow ? tomorrow : value;

    setDateFilter(prev => ({
      ...prev,
      [field]: selectedDate
    }));
  };

  const toggleDateFilter = () => {
    setDateFilter(prev => ({
      ...prev,
      enabled: !prev.enabled
    }));
  };

  const setWeekFilter = () => {
    setDateFilter({
      startDate: upcomingWeek.start,
      endDate: upcomingWeek.end,
      enabled: true
    });
  };

  const setMonthFilter = () => {
    setDateFilter({
      startDate: upcomingMonth.start,
      endDate: upcomingMonth.end,
      enabled: true
    });
  };

  const clearDateFilter = () => {
    setDateFilter(prev => ({
      ...prev,
      enabled: false
    }));
  };

  const getFilterDisplayText = () => {
    if (!dateFilter.enabled) return 'All upcoming';

    // Fix timezone issue: avoid using new Date() constructor with date strings for display
    const formatLocalDate = (dateStr: string) => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString();
    };

    // Check if it's upcoming week
    if (dateFilter.startDate === upcomingWeek.start &&
      dateFilter.endDate === upcomingWeek.end) {
      return 'This Week';
    }

    // Check if it's upcoming month
    if (dateFilter.startDate === upcomingMonth.start &&
      dateFilter.endDate === upcomingMonth.end) {
      return 'This Month';
    }

    // Check if it's the same date
    if (dateFilter.startDate === dateFilter.endDate) {
      return formatLocalDate(dateFilter.startDate);
    }

    // Date range
    return `${formatLocalDate(dateFilter.startDate)} - ${formatLocalDate(dateFilter.endDate)}`;
  };

  return (
    <div className={className}>
      <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={dateFilter.enabled ? "default" : "outline"}
            size="sm"
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            {getFilterDisplayText()}
            {dateFilter.enabled && (
              <X className="w-3 h-3 ml-1" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Filter by Date</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFilterOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="enableUpcomingFilter"
                  checked={dateFilter.enabled}
                  onChange={toggleDateFilter}
                  className="rounded"
                />
                <label htmlFor="enableUpcomingFilter" className="text-sm font-medium">
                  Enable date filter
                </label>
              </div>

              {dateFilter.enabled && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        From Date
                      </label>
                      <Input
                        type="date"
                        value={dateFilter.startDate}
                        min={tomorrow}
                        onChange={(e) => handleDateFilterChange('startDate', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">
                        To Date
                      </label>
                      <Input
                        type="date"
                        value={dateFilter.endDate}
                        min={tomorrow}
                        onChange={(e) => handleDateFilterChange('endDate', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={setWeekFilter}
                      className="text-xs"
                    >
                      This Week
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={setMonthFilter}
                      className="text-xs"
                    >
                      This Month
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearDateFilter}
                      className="text-xs col-span-2"
                    >
                      Show All
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}