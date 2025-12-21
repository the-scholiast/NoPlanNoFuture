import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { DAYS_OF_WEEK, DAY_ABBREVIATIONS } from '@/lib/utils/constants';
import { TaskFormDataValue } from '../types';
import { ColorPicker } from './ColorPicker';

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
}

// Basic task fields component
export function TaskBasicFields({ task, updateField, isSubmitting, disabledFields = {} }: TaskFormFieldsProps) {
  return (
    <>
      {/* Task Input */}
      <div>
        <label className="text-sm font-medium mb-2 block">Task Name *</label>
        <Input
          placeholder="Enter task name..."
          value={task.title}
          onChange={(e) => updateField('title', e.target.value)}
          className="w-full"
          disabled={isSubmitting || disabledFields.title}
        />
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