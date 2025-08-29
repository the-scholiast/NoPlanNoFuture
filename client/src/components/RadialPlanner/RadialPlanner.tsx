'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import { useTimetableData } from '@/components/calendar/timetable/hooks/useTimetableData';
import { formatDateString } from '@/lib/utils/dateUtils';
import type { TaskData } from '@/types/todoTypes';

interface Task {
  title: string;
  start: number;
  end: number;
  remarks: string;
  hourGroup: 'AM' | 'PM';
  displayRing?: 'inner' | 'outer';
  id?: string;
  source: 'planner' | 'timetable';
  isRecurring?: boolean;
}

const RadialPlanner: React.FC = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [plannerTasks, setPlannerTasks] = useState<Task[]>([]);
  const [formVisible, setFormVisible] = useState<boolean>(false);
  const [newTask, setNewTask] = useState<Task>({ title: '', start: 0, end: 1, remarks: '', hourGroup: 'AM', source: 'planner' });
  const [startTime, setStartTime] = useState<string>("12:00");
  const [endTime, setEndTime] = useState<string>("1:00");
  const [timeError, setTimeError] = useState<string>("");

  const { currentDate, scheduledTasks, isMounted } = useTimetableData({});
  const selectedDateString = useMemo(() => currentDate ? formatDateString(currentDate) : '', [currentDate]);

  const convertTimetableTaskToRadial = (task: TaskData): Task | null => {
    if (!task.start_time || !task.end_time) return null;

    const [sh, sm] = task.start_time.split(':').map(Number);
    const [eh, em] = task.end_time.split(':').map(Number);

    const startIsPM = sh >= 12;
    const to12Hour = (h: number) => {
      const hh = h % 12;
      return hh === 0 ? 12 : hh;
    };
    const start12h = to12Hour(sh) + (sm || 0) / 60;
    const end12h = to12Hour(eh) + (em || 0) / 60;
    const hourGroup: 'AM' | 'PM' = startIsPM ? 'PM' : 'AM';

    return {
      id: task.id,
      title: task.title,
      start: start12h === 12 ? 0 : start12h,
      end: end12h === 12 ? 0 : end12h,
      remarks: '',
      hourGroup,
      source: 'timetable',
      isRecurring: !!task.is_recurring,
    };
  };

  const timetableDayTasks: Task[] = useMemo(() => {
    if (!isMounted || !selectedDateString) return [];
    const dayTasks = (scheduledTasks || []).filter((t) => {
      const dateStr = (t.instance_date || t.start_date) || '';
      return dateStr === selectedDateString;
    });
    return dayTasks.map(convertTimetableTaskToRadial).filter((t): t is Task => t !== null);
  }, [isMounted, selectedDateString, scheduledTasks]);

  const localKey = useMemo(() => selectedDateString ? `radial-planner-${selectedDateString}` : '', [selectedDateString]);

  useEffect(() => {
    if (!localKey) return;
    try {
      const raw = localStorage.getItem(localKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Task>[];
        const normalized: Task[] = parsed.map((p): Task => ({
          title: p.title || '',
          start: typeof p.start === 'number' ? p.start : 0,
          end: typeof p.end === 'number' ? p.end : 0,
          remarks: p.remarks || '',
          hourGroup: (p.hourGroup as 'AM' | 'PM') || 'AM',
          displayRing: p.displayRing,
          id: p.id,
          source: 'planner',
          isRecurring: false,
        }));
        setPlannerTasks(normalized);
      } else {
        setPlannerTasks([]);
      }
    } catch (e) {
      console.warn('Failed to load planner tasks from localStorage', e);
      setPlannerTasks([]);
    }
  }, [localKey]);

  const persistPlannerTasks = (items: Task[]) => {
    if (!localKey) return;
    setPlannerTasks(items);
    try {
      localStorage.setItem(localKey, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save planner tasks to localStorage', e);
    }
  };

  const validateTimeString = (timeStr: string): boolean => {
    // Allow single digit hours (1-12) and proper HH:MM format
    const timeRegex = /^(1[0-2]|[1-9])(:([0-5][0-9]))?$/;
    return timeRegex.test(timeStr);
  };

  const parseTimeString = (timeStr: string): number => {
    if (!validateTimeString(timeStr)) {
      return 0;
    }

    // Handle cases like "2" -> "2:00"
    const parts = timeStr.includes(':') ? timeStr.split(':') : [timeStr, '0'];
    const [hourStr, minuteStr] = parts;
    const hour = parseInt(hourStr);
    const minute = parseInt(minuteStr) || 0;
    return (hour === 12 ? 0 : hour) + minute / 60;
  };

  const validateTimes = (): boolean => {
    setTimeError("");

    if (!validateTimeString(startTime)) {
      setTimeError("Start time must be 1-12 (e.g., 9 or 9:30)");
      return false;
    }

    if (!validateTimeString(endTime)) {
      setTimeError("End time must be 1-12 (e.g., 10 or 10:30)");
      return false;
    }

    const start = parseTimeString(startTime);
    const end = parseTimeString(endTime);

    if (newTask.hourGroup === 'PM' && end <= start) {
      setTimeError("End time must be after start time for PM tasks");
      return false;
    }

    // For AM tasks, allow cross-period (e.g., 11 AM to 1 PM)
    return true;
  };

  const formatTimeInput = (input: string): string => {
    // Remove all non-digits and colons
    const cleaned = input.replace(/[^\d:]/g, '');

    // If it's just digits, handle auto-formatting
    if (!/[:]/g.test(cleaned)) {
      const digits = cleaned.replace(/\D/g, '');

      if (digits.length === 0) return '';
      if (digits.length === 1) return digits;
      if (digits.length === 2) {
        const hour = parseInt(digits);
        // If it's a valid hour (1-12), auto-add :00
        if (hour >= 1 && hour <= 12) {
          return digits + ':00';
        }
        return digits;
      }
      if (digits.length === 3) return `${digits[0]}:${digits.slice(1)}`;
      if (digits.length >= 4) return `${digits.slice(0, 2)}:${digits.slice(2, 4)}`;
    }

    return cleaned;
  };

  const handleTimeInput = (value: string, setter: (val: string) => void) => {
    const formatted = formatTimeInput(value);
    setter(formatted);
    setTimeError("");
  };

  const addTask = () => {
    if (!validateTimes() || !newTask.title.trim()) {
      return;
    }

    const taskToAdd: Task = {
      ...newTask,
      start: parseTimeString(startTime),
      end: parseTimeString(endTime),
      source: 'planner',
      id: `planner_${Date.now()}`,
    };

    const next = [...plannerTasks, taskToAdd];
    persistPlannerTasks(next);
    setNewTask({ title: '', start: 0, end: 1, remarks: '', hourGroup: 'AM', source: 'planner' });
    setStartTime("12:00");
    setEndTime("1:00");
    setTimeError("");
    setFormVisible(false);
  };

  const outerRadius = 100;
  const innerRadius = 60;
  const center = 200;

  const getTimeColor = (hour: number, isAM: boolean) => {
    let actualHour = hour;
    if (!isAM) actualHour += 12;
    if (actualHour === 24) actualHour = 0;

    if (actualHour >= 5 && actualHour < 7) {
      // Early morning 5-7AM
      return isDarkMode ? '#4FD1C7' : '#FBB6CE'; // Teal/Pink
    } else if (actualHour >= 7 && actualHour < 11) {
      // Morning 7-11AM  
      return isDarkMode ? '#68D391' : '#90CDF4'; // Green/Blue
    } else if (actualHour >= 11 && actualHour < 17) {
      // Afternoon 11AM-5PM
      return isDarkMode ? '#F6AD55' : '#A78BFA'; // Orange/Purple
    } else if (actualHour >= 17 && actualHour < 20) {
      // Evening 5-8PM
      return isDarkMode ? '#FC8181' : '#34D399'; // Red/Emerald
    } else {
      // Night (other times)
      return isDarkMode ? '#9F7AEA' : '#F687B3'; // Purple/Pink
    }
  };

  // Helper function to wrap text
  const wrapText = (text: string, maxWidth: number) => {
    if (text.length <= maxWidth) return [text];

    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + word).length <= maxWidth) {
        currentLine += (currentLine ? ' ' : '') + word;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);

    return lines.length > 2 ? [lines[0], lines[1] + '...'] : lines;
  };

  // Helper function to get text color based on background
  const getTextColor = (backgroundColor: string) => {
    // Simple contrast check
    const darkColors = ['#4FD1C7', '#68D391', '#F6AD55', '#FC8181', '#9F7AEA'];
    const lightColors = ['#FBB6CE', '#90CDF4', '#A78BFA', '#34D399', '#F687B3'];

    if (isDarkMode) {
      return darkColors.includes(backgroundColor) ? '#1A202C' : '#FFFFFF';
    } else {
      return lightColors.includes(backgroundColor) ? '#1A202C' : '#2D3748';
    }
  };

  const getOptimalTextPosition = (startAngle: number, endAngle: number, radius: number, isInnerRing: boolean) => {
    let midAngle = (startAngle + endAngle) / 2;
    const span = Math.abs(endAngle - startAngle);

    // Calculate arc length to determine text size and positioning
    const arcLength = span * radius;

    // For tasks that cross the 11-1 position (around -π/2 to π/2), adjust text position
    if (span > Math.PI) {
      // For large spans, place text at the bottom of the arc
      midAngle = midAngle + Math.PI;
    } else if (midAngle > -Math.PI / 3 && midAngle < Math.PI / 3) {
      // For tasks near 12 o'clock, move text slightly outward
      const textRadius = isInnerRing ? radius * 0.8 : (radius + innerRadius) / 2 + 15;
      return {
        x: center + textRadius * Math.cos(midAngle),
        y: center + textRadius * Math.sin(midAngle),
        angle: midAngle,
        arcLength,
        shouldRotate: span < Math.PI / 3 // Rotate text for narrow arcs
      };
    }

    const textRadius = isInnerRing ? radius * 0.6 : (radius + innerRadius) / 2;
    return {
      x: center + textRadius * Math.cos(midAngle),
      y: center + textRadius * Math.sin(midAngle),
      angle: midAngle,
      arcLength,
      shouldRotate: span < Math.PI / 3
    };
  };

  const renderCrossPeriodTask = (task: Task, index: number) => {
    const offset = -Math.PI / 2;
    const originalIndex = index;

    const amPortion = {
      start: task.start,
      end: 12,
      ring: 'outer'
    };

    const pmPortion = {
      start: 0,
      end: task.end,
      ring: 'inner'
    };

    const portions = [amPortion, pmPortion];
    const elements = [];

    portions.forEach((portion, portionIndex) => {
      const isInnerRing = portion.ring === 'inner';
      const duration = Math.abs(portion.end - portion.start);

      const startAngle = (portion.start / 12) * 2 * Math.PI + offset;
      const endAngle = (portion.end / 12) * 2 * Math.PI + offset;

      const radiusExtension = Math.max(0, (duration - 1) * 8);
      const baseRadius = isInnerRing ? innerRadius : outerRadius;
      const radius = baseRadius + radiusExtension;

      const x1 = center;
      const y1 = center;
      const x2 = center + radius * Math.cos(startAngle);
      const y2 = center + radius * Math.sin(startAngle);
      const x3 = center + radius * Math.cos(endAngle);
      const y3 = center + radius * Math.sin(endAngle);

      const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

      let pathData;
      if (isInnerRing) {
        pathData = `M${x1},${y1} L${x2},${y2} A${radius},${radius} 0 ${largeArc} 1 ${x3},${y3} Z`;
      } else {
        const innerX2 = center + innerRadius * Math.cos(startAngle);
        const innerY2 = center + innerRadius * Math.sin(startAngle);
        const innerX3 = center + innerRadius * Math.cos(endAngle);
        const innerY3 = center + innerRadius * Math.sin(endAngle);

        pathData = `M${x2},${y2} A${radius},${radius} 0 ${largeArc} 1 ${x3},${y3} L${innerX3},${innerY3} A${innerRadius},${innerRadius} 0 ${largeArc} 0 ${innerX2},${innerY2} Z`;
      }

      const textPos = getOptimalTextPosition(startAngle, endAngle, radius, isInnerRing);
      const avgTime = (portion.start + portion.end) / 2;
      const colorTimeGroup = portionIndex === 0 ? 'AM' : 'PM';
      const taskColor = getTimeColor(avgTime, colorTimeGroup === 'AM');
      const textColor = getTextColor(taskColor);

      const baseFontSize = duration > 2 ? 11 : duration > 1 ? 10 : 9;
      const fontSize = Math.min(baseFontSize, Math.max(8, textPos.arcLength / 8));
      const maxCharsPerLine = Math.floor(textPos.arcLength / (fontSize * 0.6));
      const textLines = wrapText(task.title, maxCharsPerLine);

      const textRotation = textPos.shouldRotate ?
        `rotate(${(textPos.angle * 180 / Math.PI)}, ${textPos.x}, ${textPos.y})` : '';

      elements.push(
        <g key={`cross-task-${originalIndex}-${portionIndex}`}>
          <path
            d={pathData}
            fill={taskColor}
            strokeWidth={0}
            opacity="0.9"
          />
          <g transform={textRotation}>
            {textLines.map((line, lineIndex) => (
              <text
                key={`cross-text-${originalIndex}-${portionIndex}-${lineIndex}`}
                x={textPos.x}
                y={textPos.y + (lineIndex - (textLines.length - 1) / 2) * (fontSize + 2)}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={fontSize}
                fill={textColor}
                fontWeight="600"
                style={{
                  textShadow: isDarkMode ? '1px 1px 2px rgba(0,0,0,0.8)' : '1px 1px 2px rgba(255,255,255,0.8)',
                  cursor: 'default'
                }}
              >
                {line}
              </text>
            ))}
          </g>
        </g>
      );
    });

    const connectionAngle = 0 + offset;
    const outerConnectionX = center + outerRadius * Math.cos(connectionAngle);
    const outerConnectionY = center + outerRadius * Math.sin(connectionAngle);
    const innerConnectionX = center + innerRadius * Math.cos(connectionAngle);
    const innerConnectionY = center + innerRadius * Math.sin(connectionAngle);

    elements.push(
      <line
        key={`connection-${originalIndex}`}
        x1={outerConnectionX}
        y1={outerConnectionY}
        x2={innerConnectionX}
        y2={innerConnectionY}
        stroke={isDarkMode ? "white" : "#2d3748"}
        strokeWidth="2"
        opacity="0.8"
      />
    );

    return elements;
  };

  const allTasks = useMemo(() => [...timetableDayTasks, ...plannerTasks], [timetableDayTasks, plannerTasks]);

  const renderTasks = () => {
    console.log("=== rendering tasks ===");
    const elements: React.ReactElement[] = [];

    const sortedTasks = [...allTasks].sort((a, b) => {
      const aRing = a.hourGroup === 'AM' ? 'outer' : 'inner';
      const bRing = b.hourGroup === 'AM' ? 'outer' : 'inner';

      if (aRing !== bRing) {
        return aRing === 'outer' ? -1 : 1;
      }

      const durationA = getTaskDuration(a);
      const durationB = getTaskDuration(b);
      return durationB - durationA;
    });

    sortedTasks.forEach((task, index) => {
      const isCrossPeriod = task.hourGroup === 'AM' && task.end < task.start;

      if (isCrossPeriod) {
        elements.push(...renderCrossPeriodTask(task, index));
        return;
      }

      const useRing = task.hourGroup === 'AM' ? 'outer' : 'inner';
      const isInnerRing = useRing === 'inner';

      const offset = -Math.PI / 2;

      const startHour = task.start;
      const endHour = task.end;

      const duration = Math.abs(endHour - startHour);
      const startAngle = (startHour / 12) * 2 * Math.PI + offset;
      const endAngle = (endHour / 12) * 2 * Math.PI + offset;

      const radiusExtension = Math.max(0, (duration - 1) * 8);
      const baseRadius = isInnerRing ? innerRadius : outerRadius;
      const radius = baseRadius + radiusExtension;

      const x1 = center;
      const y1 = center;
      const x2 = center + radius * Math.cos(startAngle);
      const y2 = center + radius * Math.sin(startAngle);
      const x3 = center + radius * Math.cos(endAngle);
      const y3 = center + radius * Math.sin(endAngle);

      const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

      let pathData;
      if (isInnerRing) {
        pathData = `M${x1},${y1} L${x2},${y2} A${radius},${radius} 0 ${largeArc} 1 ${x3},${y3} Z`;
      } else {
        const innerX2 = center + innerRadius * Math.cos(startAngle);
        const innerY2 = center + innerRadius * Math.sin(startAngle);
        const innerX3 = center + innerRadius * Math.cos(endAngle);
        const innerY3 = center + innerRadius * Math.sin(endAngle);

        pathData = `M${x2},${y2} A${radius},${radius} 0 ${largeArc} 1 ${x3},${y3} L${innerX3},${innerY3} A${innerRadius},${innerRadius} 0 ${largeArc} 0 ${innerX2},${innerY2} Z`;
      }

      const textPos = getOptimalTextPosition(startAngle, endAngle, radius, isInnerRing);
      const originalIndex = sortedTasks.findIndex(t => t === task);
      const avgTime = (startHour + endHour) / 2;
      const colorTimeGroup = task.hourGroup;
      const taskColor = getTimeColor(avgTime, colorTimeGroup === 'AM');
      const textColor = getTextColor(taskColor);

      // Calculate font size and text wrapping based on arc length
      const baseFontSize = duration > 3 ? 12 : duration > 2 ? 11 : duration > 1 ? 10 : 9;
      const fontSize = Math.min(baseFontSize, Math.max(8, textPos.arcLength / 8));
      const maxCharsPerLine = Math.floor(textPos.arcLength / (fontSize * 0.6));
      const textLines = wrapText(task.title, maxCharsPerLine);

      // Determine if text should be rotated
      const textRotation = textPos.shouldRotate ?
        `rotate(${(textPos.angle * 180 / Math.PI)}, ${textPos.x}, ${textPos.y})` : '';

      elements.push(
        <g key={`task-${originalIndex}`}>
          <path
            d={pathData}
            fill={taskColor}
            strokeWidth={0}
            opacity="0.9"
          />
          <g transform={textRotation}>
            {textLines.map((line, lineIndex) => (
              <text
                key={`text-${originalIndex}-${lineIndex}`}
                x={textPos.x}
                y={textPos.y + (lineIndex - (textLines.length - 1) / 2) * (fontSize + 2)}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={fontSize}
                fill={textColor}
                fontWeight="600"
                style={{
                  textShadow: isDarkMode ? '1px 1px 2px rgba(0,0,0,0.8)' : '1px 1px 2px rgba(255,255,255,0.8)',
                  cursor: 'default'
                }}
              >
                {line}
              </text>
            ))}
          </g>
        </g>
      );
    });

    return elements;
  };

  const renderTimeMarks = () => {
    const marks = [];
    const offset = -Math.PI / 2;

    for (let i = 0; i < 24; i++) {
      const angle = (i / 12) * Math.PI + offset;
      const isHourMark = i % 2 === 0;

      const markLength = isHourMark ? 15 : 8;
      const strokeWidth = isHourMark ? 2 : 1;

      const outerX = center + outerRadius * Math.cos(angle);
      const outerY = center + outerRadius * Math.sin(angle);
      const innerX = center + (outerRadius - markLength) * Math.cos(angle);
      const innerY = center + (outerRadius - markLength) * Math.sin(angle);

      marks.push(
        <line
          key={`outer-mark-${i}`}
          x1={outerX}
          y1={outerY}
          x2={innerX}
          y2={innerY}
          stroke={isDarkMode ? "white" : "#2d3748"}
          strokeWidth={strokeWidth}
          opacity="0.7"
        />
      );
    }

    return marks;
  };

  const renderInnerHourMarks = () => {
    const marks = [];
    const offset = -Math.PI / 2;

    for (let i = 0; i < 12; i++) {
      const angle = (i / 6) * Math.PI + offset;

      const markLength = 12;
      const strokeWidth = 1.5;

      const outerX = center + innerRadius * Math.cos(angle);
      const outerY = center + innerRadius * Math.sin(angle);
      const innerX = center + (innerRadius - markLength) * Math.cos(angle);
      const innerY = center + (innerRadius - markLength) * Math.sin(angle);

      marks.push(
        <line
          key={`inner-hour-mark-${i}`}
          x1={outerX}
          y1={outerY}
          x2={innerX}
          y2={innerY}
          stroke={isDarkMode ? "white" : "#2d3748"}
          strokeWidth={strokeWidth}
          opacity="0.9"
        />
      );
    }

    return marks;
  };

  const renderClockNumbers = () => {
    const numbers = [];
    const offset = -Math.PI / 2;

    const maxTaskRadius = Math.max(
      outerRadius + Math.max(...allTasks.filter((t: Task) => t.hourGroup === 'AM').map((t: Task) => {
        const duration = getTaskDuration(t);
        return Math.max(0, (duration - 1) * 8);
      }), 0),
      innerRadius + Math.max(...allTasks.filter((t: Task) => t.hourGroup === 'PM').map((t: Task) => {
        const duration = getTaskDuration(t);
        return Math.max(0, (duration - 1) * 8);
      }), 0)
    );
    const numberRadius = maxTaskRadius + 50;

    for (let hour = 1; hour <= 12; hour++) {
      const angle = ((hour === 12 ? 0 : hour) / 12) * 2 * Math.PI + offset;
      const x = center + numberRadius * Math.cos(angle);
      const y = center + numberRadius * Math.sin(angle);

      numbers.push(
        <text
          key={hour}
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="16"
          fill={isDarkMode ? '#ffffff' : '#2d3748'}
          fontWeight="bold"
        >
          {hour}
        </text>
      );
    }
    return numbers;
  };

  const deletePlannerTask = (id?: string) => {
    if (!id) return;
    const next = plannerTasks.filter(t => t.id !== id);
    persistPlannerTasks(next);
  };

  const formatTime = (timeValue: number, hourGroup: string) => {
    const hours = Math.floor(timeValue);
    const minutes = Math.round((timeValue % 1) * 60);
    const displayHour = hours === 0 ? 12 : hours;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${hourGroup}`;
  };

  const getTaskDuration = (task: Task) => {
    if (task.hourGroup === 'AM' && task.end < task.start) {
      return (12 - task.start) + task.end;
    }
    return Math.abs(task.end - task.start);
  };

  return (
    <div className={`flex flex-col items-center justify-center pb-10 p-4 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className="flex items-center gap-4 mb-6">
        <h1
          className="text-3xl font-bold"
          style={{ color: isDarkMode ? '#63b1bf' : '#ff8c42' }}
        >
          Radial Day Planner
        </h1>
      </div>

      <button
        className="bg-blue-500 px-6 py-3 rounded-lg hover:bg-blue-600 mb-6 text-lg font-semibold transition-colors text-white"
        onClick={() => setFormVisible(true)}
      >
        Add Task
      </button>

      {formVisible && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white text-black p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-bold mb-4">Add New Task</h3>

            <label className="block mb-2 font-semibold">Title</label>
            <input
              type="text"
              className="w-full border px-3 py-2 mb-3 rounded"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              placeholder="Enter task title"
            />

            <label className="block mb-2 font-semibold">Time Period</label>
            <select
              className="w-full border px-3 py-2 mb-3 rounded"
              value={newTask.hourGroup}
              onChange={(e) => setNewTask({ ...newTask, hourGroup: e.target.value as 'AM' | 'PM' })}
            >
              <option value="AM">AM (Morning)</option>
              <option value="PM">PM (Afternoon/Evening)</option>
            </select>

            <div className="flex gap-3 mb-3">
              <div className="flex-1">
                <label className="block mb-2 font-semibold">Start Time</label>
                <input
                  type="text"
                  className="w-full border px-3 py-2 rounded"
                  value={startTime}
                  onChange={(e) => handleTimeInput(e.target.value, setStartTime)}
                  placeholder="9 or 9:30"
                />
                <small className="text-gray-600">Format: H or H:MM (1-12)</small>
              </div>
              <div className="flex-1">
                <label className="block mb-2 font-semibold">End Time</label>
                <input
                  type="text"
                  className="w-full border px-3 py-2 rounded"
                  value={endTime}
                  onChange={(e) => handleTimeInput(e.target.value, setEndTime)}
                  placeholder="10 or 10:30"
                />
                <small className="text-gray-600">Format: H or H:MM (1-12)</small>
              </div>
            </div>

            {timeError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-3">
                {timeError}
              </div>
            )}

            <label className="block mb-2 font-semibold">Notes</label>
            <textarea
              className="w-full border px-3 py-2 mb-4 rounded"
              rows={3}
              value={newTask.remarks}
              onChange={(e) => setNewTask({ ...newTask, remarks: e.target.value })}
              placeholder="Optional notes about this task"
            />

            <div className="flex justify-between gap-3">
              <button
                className="bg-green-500 px-4 py-2 rounded hover:bg-green-600 text-white font-semibold flex-1 transition-colors disabled:bg-gray-400"
                onClick={addTask}
                disabled={!newTask.title.trim()}
              >
                Add Task
              </button>
              <button
                className="bg-red-500 px-4 py-2 rounded hover:bg-red-600 text-white font-semibold flex-1 transition-colors"
                onClick={() => {
                  setFormVisible(false);
                  setTimeError("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row items-start gap-8">
        <svg
          width="400"
          height="400"
          className={`${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-300'} rounded-full shadow-lg`}
          viewBox="0 0 400 400">

          <circle
            cx="200"
            cy="200"
            r={outerRadius}
            fill={isDarkMode ? '#4a5568' : '#e2e8f0'}
            stroke={isDarkMode ? '#2d3748' : '#cbd5e0'}
            strokeWidth="2"
          />
          <circle
            cx="200"
            cy="200"
            r={innerRadius}
            fill={isDarkMode ? '#2d3748' : '#f7fafc'}
            stroke={isDarkMode ? '#1a202c' : '#a0aec0'}
            strokeWidth="2"
          />
          <circle
            cx="200"
            cy="200"
            r="4"
            fill={isDarkMode ? '#e2e8f0' : '#2d3748'}
          />

          {renderTasks()}
          {renderTimeMarks()}
          {renderInnerHourMarks()}
          {renderClockNumbers()}
        </svg>

        {allTasks.length > 0 && (
          <div className={`p-4 rounded-lg shadow-lg min-w-[500px] ${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-300'}`}>
            <h3 className="text-lg font-bold mb-3">Tasks</h3>
            <div className="space-y-1">
              {allTasks.map((task, index) => (
                <div key={task.id || index} className={`p-3 rounded flex items-center transition-colors ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}>
                  <div className="flex-shrink-0 w-32 text-sm font-medium">
                    {formatTime(task.start, task.hourGroup)}
                  </div>
                  <div className="flex-shrink-0 w-32 text-sm font-medium">
                    {task.end < task.start && task.hourGroup === 'AM' ?
                      formatTime(task.end, 'PM') :
                      formatTime(task.end, task.hourGroup)
                    }
                  </div>
                  <div className="font-medium flex-1 min-w-0 mx-3" title={task.title}>
                    {task.title}
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full mr-2 ${task.source === 'timetable' ? (isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-700') : (isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-700')}`}>
                    {task.source === 'timetable' ? 'Timetable' : 'Planner'}{task.isRecurring ? ' • Recurring' : ''}
                  </div>
                  {task.remarks && (
                    <div className={`text-sm flex-1 min-w-0 mx-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} title={task.remarks}>
                      {task.remarks}
                    </div>
                  )}
                  {task.source === 'planner' ? (
                    <button
                      onClick={() => deletePlannerTask(task.id)}
                      className={`ml-3 flex-shrink-0 ${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-500'}`}
                    >
                      ✕
                    </button>
                  ) : (
                    <span className={`ml-3 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Read-only</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RadialPlanner;