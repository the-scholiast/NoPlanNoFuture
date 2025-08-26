'use client'

import React from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { getTodayString } from '@/lib/utils/dateUtils';
import { formatLocalDate, DateRangeFilter, getLast7DaysStart, getCurrentWeekEnd, getLast7DaysEnd, getCurrentWeekStart, getMonthStartAndEndDate } from '../';

interface DateFilterProps {
  dateFilter: DateRangeFilter;
  onFilterChange: (filter: Partial<DateRangeFilter>) => void;
  className?: string;
}

export function DateFilter({ dateFilter, onFilterChange, className }: DateFilterProps) {
  const getFilterDisplayText = () => {
    if (!dateFilter.enabled) return 'All dates';

    const today = getTodayString();

    if (dateFilter.startDate === dateFilter.endDate && dateFilter.startDate === today) {
      return 'Today';
    }

    if (dateFilter.startDate === dateFilter.endDate) {
      return formatLocalDate(dateFilter.startDate);
    }

    return `${formatLocalDate(dateFilter.startDate)} - ${formatLocalDate(dateFilter.endDate)}`;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={`gap-2 ${className}`}>
          <Filter className="w-4 h-4" />
          {getFilterDisplayText()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Enable Date Filter</Label>
            <Switch
              checked={dateFilter.enabled}
              onCheckedChange={(checked) => onFilterChange({ enabled: checked })}
            />
          </div>

          {dateFilter.enabled && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={dateFilter.startDate}
                    onChange={(e) => onFilterChange({ startDate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={dateFilter.endDate}
                    onChange={(e) => onFilterChange({ endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = getTodayString();
                    onFilterChange({ startDate: today, endDate: today });
                  }}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const startDate = getCurrentWeekStart();
                    const endDate = getCurrentWeekEnd();
                    onFilterChange({ startDate, endDate });
                  }}
                >
                  This Week
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onFilterChange({ startDate: getLast7DaysStart(), endDate: getLast7DaysEnd() });
                  }}
                >
                  Last 7 Days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const { startDate, endDate } = getMonthStartAndEndDate();
                    onFilterChange({ startDate, endDate });
                  }}
                >
                  This Month
                </Button>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFilterChange({ enabled: false })}
                className="w-full"
              >
                Clear Filter
              </Button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}