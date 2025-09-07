import type { Task, TextPosition } from './types';
import type { TaskData } from '@/types/todoTypes';

export const convertTimetableTaskToRadial = (task: TaskData): Task | null => {
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
  
  // Use start time's hour group as primary
  const hourGroup: 'AM' | 'PM' = startIsPM ? 'PM' : 'AM';
  
  // Store the original 24-hour times for proper conversion in TaskRenderer
  return {
    id: task.id,
    title: task.title,
    start: start12h,
    end: end12h,
    remarks: '',
    hourGroup,
    source: 'timetable',
    isRecurring: !!task.is_recurring,
    // Add original 24h times for proper conversion
    start24h: sh + (sm || 0) / 60,
    end24h: eh + (em || 0) / 60,
  } as Task & { start24h: number; end24h: number };
};

export const validateTimeString = (timeStr: string): boolean => {
  const timeRegex = /^(1[0-2]|[1-9])(:([0-5][0-9]))?$/;
  return timeRegex.test(timeStr);
};

export const parseTimeString = (timeStr: string): number => {
  if (!validateTimeString(timeStr)) {
    return 0;
  }

  const parts = timeStr.includes(':') ? timeStr.split(':') : [timeStr, '0'];
  const [hourStr, minuteStr] = parts;
  const hour = parseInt(hourStr);
  const minute = parseInt(minuteStr) || 0;
  return hour + minute / 60;
};

export const formatTimeInput = (input: string): string => {
  const cleaned = input.replace(/[^\d:]/g, '');

  if (!/[:]/g.test(cleaned)) {
    const digits = cleaned.replace(/\D/g, '');

    if (digits.length === 0) return '';
    if (digits.length === 1) return digits;
    if (digits.length === 2) {
      const hour = parseInt(digits);
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

export const getTimeColor = (hour: number, isAM: boolean, isDarkMode: boolean) => {
  let actualHour = hour;
  if (!isAM) actualHour += 12;
  if (actualHour === 24) actualHour = 0;

  if (actualHour >= 5 && actualHour < 7) {
    return isDarkMode ? '#4FD1C7' : '#FBB6CE';
  } else if (actualHour >= 7 && actualHour < 11) {
    return isDarkMode ? '#68D391' : '#90CDF4';
  } else if (actualHour >= 11 && actualHour < 17) {
    return isDarkMode ? '#F6AD55' : '#A78BFA';
  } else if (actualHour >= 17 && actualHour < 20) {
    return isDarkMode ? '#FC8181' : '#34D399';
  } else {
    return isDarkMode ? '#9F7AEA' : '#F687B3';
  }
};

export const getTextColor = (backgroundColor: string, isDarkMode: boolean) => {
  const darkColors = ['#4FD1C7', '#68D391', '#F6AD55', '#FC8181', '#9F7AEA'];
  const lightColors = ['#FBB6CE', '#90CDF4', '#A78BFA', '#34D399', '#F687B3'];

  if (isDarkMode) {
    return darkColors.includes(backgroundColor) ? '#1A202C' : '#FFFFFF';
  } else {
    return lightColors.includes(backgroundColor) ? '#1A202C' : '#2D3748';
  }
};

export const wrapText = (text: string, maxWidth: number) => {
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

export const getOptimalTextPosition = (
  startAngle: number, 
  endAngle: number, 
  radius: number, 
  isInnerRing: boolean,
  center: number
): TextPosition => {
  let midAngle = (startAngle + endAngle) / 2;
  const span = Math.abs(endAngle - startAngle);
  const arcLength = span * radius;

  if (span > Math.PI) {
    midAngle = midAngle + Math.PI;
  } else if (midAngle > -Math.PI / 3 && midAngle < Math.PI / 3) {
    const textRadius = isInnerRing ? radius * 0.8 : (radius + 60) / 2 + 15;
    return {
      x: center + textRadius * Math.cos(midAngle),
      y: center + textRadius * Math.sin(midAngle),
      angle: midAngle,
      arcLength,
      shouldRotate: span < Math.PI / 3
    };
  }

  const textRadius = isInnerRing ? radius * 0.6 : (radius + 60) / 2;
  return {
    x: center + textRadius * Math.cos(midAngle),
    y: center + textRadius * Math.sin(midAngle),
    angle: midAngle,
    arcLength,
    shouldRotate: span < Math.PI / 3
  };
};

export const getTaskDuration = (task: Task) => {
  if (task.hourGroup === 'AM' && task.end < task.start) {
    return (12 - task.start) + task.end;
  }
  return Math.abs(task.end - task.start);
};

export const formatTime = (timeValue: number, hourGroup: string) => {
  const hours = Math.floor(timeValue);
  const minutes = Math.round((timeValue % 1) * 60);
  const displayHour = hours === 0 ? 12 : hours;
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${hourGroup}`;
};
