export interface Task {
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

export interface TextPosition {
  x: number;
  y: number;
  angle: number;
  arcLength: number;
  shouldRotate: boolean;
}

export interface TaskPortion {
  start: number;
  end: number;
  ring: 'inner' | 'outer';
}
