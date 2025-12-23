import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { DAYS_OF_WEEK, DAY_ABBREVIATIONS } from '@/lib/utils/constants';
import { TaskFormDataValue } from '../types';
import { ColorPicker } from './ColorPicker';
import { useState, useMemo, useRef, useEffect } from 'react';

export interface TaskFormData {
  title: string;
  section: 'daily' | 'today' | 'upcoming' | 'none';
  priority: 'low' | 'medium' | 'high';
  description: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  recurring_days: string[];
  is_schedule?: boolean;
  color?: string;
  is_secondary?: boolean;
  count_in_stats?: boolean;
  count_in_work_hours?: boolean;
}

interface TaskFormFieldsProps {
  task: TaskFormData;
  updateField: (field: keyof TaskFormData, value: TaskFormDataValue) => void;
  isSubmitting: boolean;
  showScheduleField?: boolean;
  fieldPrefix?: string; // For unique IDs in multi-task forms
  disabledFields?: {
    title?: boolean;
    description?: boolean;
    section?: boolean;
    priority?: boolean;
  };
  existingTaskNames?: string[]; // List of existing task names for suggestions (sorted by closest date)
}

// Basic task fields component
export function TaskBasicFields({ task, updateField, isSubmitting, disabledFields = {}, existingTaskNames = [] }: TaskFormFieldsProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Filter existing task names that match the current input
  const suggestions = useMemo(() => {
    if (!task.title.trim() || existingTaskNames.length === 0) {
      return [];
    }
    const searchTerm = task.title.toLowerCase();
    return existingTaskNames
      .filter(name => name.toLowerCase().includes(searchTerm) && name !== task.title)
      .slice(0, 5); // Show max 5 suggestions
  }, [task.title, existingTaskNames]);

  // Handle clicking outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSuggestions]);

  return (
    <>
      {/* Task Input */}
      <div className="relative">
        <label className="text-sm font-medium mb-2 block">Task Name *</label>
        <Input
          ref={inputRef}
          placeholder="Enter task name..."
          value={task.title}
          onChange={(e) => {
            updateField('title', e.target.value);
            setShowSuggestions(e.target.value.trim().length > 0 && suggestions.length > 0);
          }}
          onFocus={() => {
            if (task.title.trim().length > 0 && suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          className="w-full"
          disabled={isSubmitting || disabledFields.title}
        />
        
        {/* Simple Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-auto"
          >
            <div className="divide-y">
              {suggestions.map((name, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    updateField('title', name);
                    setShowSuggestions(false);
                  }}
                  className="w-full text-left p-2 hover:bg-muted transition-colors text-sm"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Description Input */}
      <div>
        <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
        <Input
          placeholder="Enter task description..."
          value={task.description}
          onChange={(e) => updateField('description', e.target.value)}
          className="w-full"
          disabled={isSubmitting || disabledFields.description}
        />
      </div>

      {/* Section and Priority Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Section</label>
          <Select
            value={task.section}
            onValueChange={(value) => updateField('section', value)}
            disabled={isSubmitting || disabledFields.section}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="none">None</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Priority</label>
          <Select
            value={task.priority}
            onValueChange={(value) => updateField('priority', value)}
            disabled={isSubmitting || disabledFields.priority}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Color Picker */}
      <ColorPicker
        value={task.color}
        onChange={(color) => updateField('color', color)}
        disabled={isSubmitting}
      />
    </>
  );
}

// Recurring section component
interface RecurringSectionProps {
  task: TaskFormData;
  updateField: (field: keyof TaskFormData, value: TaskFormDataValue) => void;
  isSubmitting: boolean;
  fieldPrefix?: string;
  showRecurringToggle?: boolean; // For edit modal
  shouldShowSection?: boolean; // For add modal (daily tasks only)
  toggleDay: (day: string) => void;
  toggleEveryDay: (checked: boolean) => void;
  isEveryDaySelected: () => boolean;
  isDaySelected: (day: string) => boolean;
}

export function RecurringSection({
  task,
  updateField,
  isSubmitting,
  fieldPrefix = '',
  showRecurringToggle = true,
  shouldShowSection = true,
  toggleDay,
  toggleEveryDay,
  isEveryDaySelected,
  isDaySelected,
}: RecurringSectionProps) {
  if (!shouldShowSection) return null;

  return (
    <div className="space-y-3">
      {/* Recurring Toggle - only show if enabled */}
      {showRecurringToggle && (
        <div className="flex items-center gap-2">
          <Checkbox
            id={`recurring${fieldPrefix}`}
            checked={task.is_recurring}
            onCheckedChange={(checked) => updateField('is_recurring', checked === true)}
            disabled={isSubmitting}
          />
          <Label htmlFor={`recurring${fieldPrefix}`} className="text-sm font-medium">
            Make this task recurring
          </Label>
        </div>
      )}

      {/* Day Selection */}
      {task.is_recurring && (
        <div className="space-y-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
          {/* Everyday Toggle */}
          <div className="flex items-center gap-2">
            <Checkbox
              id={`everyday${fieldPrefix}`}
              checked={isEveryDaySelected()}
              onCheckedChange={(checked) => toggleEveryDay(checked === true)}
              disabled={isSubmitting}
            />
            <Label htmlFor={`everyday${fieldPrefix}`} className="text-sm font-medium">
              Every day
            </Label>
          </div>

          {/* Individual Day Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Or select specific days:</label>
            <div className="grid grid-cols-7 gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <div key={day} className="flex flex-col items-center">
                  <Checkbox
                    id={`${fieldPrefix}${day}`}
                    checked={isDaySelected(day)}
                    onCheckedChange={() => toggleDay(day)}
                    disabled={isSubmitting}
                  />
                  <Label
                    htmlFor={`${fieldPrefix}${day}`}
                    className="text-xs mt-1 cursor-pointer"
                  >
                    {DAY_ABBREVIATIONS[day]}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Date and time fields component
interface DateTimeFieldsProps {
  task: TaskFormData;
  updateField: (field: keyof TaskFormData, value: TaskFormDataValue) => void;
  isSubmitting: boolean;
  isEndDateDisabled?: boolean;
  getMinEndDate?: () => string;
  handleEndDateBlur?: (value: string) => void;
}

export function DateTimeFields({
  task,
  updateField,
  isSubmitting,
  isEndDateDisabled = false,
  getMinEndDate,
  handleEndDateBlur
}: DateTimeFieldsProps) {
  return (
    <>
      {/* Date Range Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Start Date</label>
          <Input
            type="date"
            value={task.start_date}
            onChange={(e) => updateField('start_date', e.target.value)}
            className="w-full"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">End Date</label>
          <Input
            type="date"
            value={task.end_date}
            onChange={(e) => updateField('end_date', e.target.value)}
            onBlur={handleEndDateBlur ? (e) => handleEndDateBlur(e.target.value) : undefined}
            className="w-full"
            disabled={isSubmitting || isEndDateDisabled}
            min={getMinEndDate ? getMinEndDate() : undefined}
          />
        </div>
      </div>

      {/* Time Range Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Start Time</label>
          <Input
            type="time"
            value={task.start_time}
            onChange={(e) => updateField('start_time', e.target.value)}
            className="w-full"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">End Time</label>
          <Input
            type="time"
            value={task.end_time}
            onChange={(e) => updateField('end_time', e.target.value)}
            className="w-full"
            disabled={isSubmitting}
            min={task.start_date === task.end_date ? task.start_time : undefined}
          />
        </div>
      </div>
    </>
  );
}

// Schedule checkbox component
interface ScheduleFieldProps {
  task: TaskFormData;
  updateField: (field: keyof TaskFormData, value: TaskFormDataValue) => void;
  isSubmitting: boolean;
  fieldPrefix?: string;
  forceChecked?: boolean;
}

export function ScheduleField({ task, updateField, isSubmitting, fieldPrefix = '', forceChecked = false }: ScheduleFieldProps) {
  const isChecked = forceChecked || task.is_schedule || false;
  const isDisabled = forceChecked || isSubmitting;

  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={`schedule${fieldPrefix}`}
        checked={isChecked}
        onCheckedChange={forceChecked ? () => { } : (checked) => updateField('is_schedule', checked === true)}
        disabled={isDisabled}
      />
      <Label htmlFor={`schedule${fieldPrefix}`} className="text-sm font-medium">
        Add to calendar/timetable
      </Label>
    </div>
  );
}

// Secondary task options component
interface SecondaryTaskFieldProps {
  task: TaskFormData;
  updateField: (field: keyof TaskFormData, value: TaskFormDataValue) => void;
  isSubmitting: boolean;
  fieldPrefix?: string;
}

export function SecondaryTaskField({ task, updateField, isSubmitting, fieldPrefix = '' }: SecondaryTaskFieldProps) {
  const isSecondary = task.is_secondary || false;
  const countInStats = task.count_in_stats !== undefined ? task.count_in_stats : true;
  const countInWorkHours = task.count_in_work_hours !== undefined ? task.count_in_work_hours : true;

  return (
    <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-md border">
      <div className="flex items-center gap-2">
        <Checkbox
          id={`secondary${fieldPrefix}`}
          checked={isSecondary}
          onCheckedChange={(checked) => {
            updateField('is_secondary', checked === true);
            // When unchecking secondary, reset count options to default
            if (!checked) {
              updateField('count_in_stats', true);
              updateField('count_in_work_hours', true);
            }
          }}
          disabled={isSubmitting}
        />
        <Label htmlFor={`secondary${fieldPrefix}`} className="text-sm font-medium">
          Mark as secondary task
        </Label>
      </div>

      {isSecondary && (
        <div className="ml-6 space-y-2 pl-4 border-l-2 border-gray-300 dark:border-gray-600">
          <div className="flex items-center gap-2">
            <Checkbox
              id={`countStats${fieldPrefix}`}
              checked={countInStats}
              onCheckedChange={(checked) => updateField('count_in_stats', checked === true)}
              disabled={isSubmitting}
            />
            <Label htmlFor={`countStats${fieldPrefix}`} className="text-sm">
              Count in statistics page
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id={`countWorkHours${fieldPrefix}`}
              checked={countInWorkHours}
              onCheckedChange={(checked) => updateField('count_in_work_hours', checked === true)}
              disabled={isSubmitting}
            />
            <Label htmlFor={`countWorkHours${fieldPrefix}`} className="text-sm">
              Count in work hours calculation
            </Label>
          </div>
        </div>
      )}
    </div>
  );
}