'use client';
import React from 'react';
import type { Task } from './types';

interface TaskRendererProps {
  tasks: Task[];
  isDarkMode: boolean;
  outerRadius: number;
  innerRadius: number;
  center: number;
  use24Hour: boolean;
}

const TICK_PER_HOUR = 12; // 5-minute grid
const BASES = ['#60a5fa', '#34d399', '#fbbf24', '#fb923c', '#f87171', '#a78bfa', '#ec4899'];

const TaskRenderer: React.FC<TaskRendererProps> = ({
  tasks,
  isDarkMode,
  outerRadius,
  innerRadius,
  center,
  use24Hour,
}) => {
  const offset = -Math.PI / 2;
  const snapHour = (h: number) => Math.round(h * TICK_PER_HOUR) / TICK_PER_HOUR;

  const convertToDisplayHour = (hour: number, hourGroup: 'AM' | 'PM'): number => {
    if (use24Hour) {
      if (hourGroup === 'PM' && hour !== 12) return hour + 12;
      if (hourGroup === 'AM' && hour === 12) return 0;
      return hour;
    }
    // 12h full-circle
    if (hourGroup === 'AM' && hour === 12) return 0;
    return hour;
  };

  const pickTaskColor = (task: Task, startHour: number): string => {
    if ((task as any).color) return (task as any).color as string;
    let idx = use24Hour ? Math.floor(startHour / 3.5) : Math.floor(startHour / 1.75);
    if (idx >= BASES.length) idx = BASES.length - 1;
    return BASES[idx];
  };

  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
  const mapRange = (v: number, inMin: number, inMax: number, outMin: number, outMax: number) => {
    const t = clamp((v - inMin) / (inMax - inMin), 0, 1);
    return outMin + (outMax - outMin) * t;
  };

  const renderTask = (task: Task, index: number) => {
    let start = convertToDisplayHour(task.start, task.hourGroup);
    let end = convertToDisplayHour(task.end, task.hourGroup);
    start = snapHour(start);
    end = snapHour(end);

    const denom = use24Hour ? 24 : 12;
    const toAngle = (val: number) => (val / denom) * Math.PI * 2 + offset;

    let startAngle = toAngle(start);
    let endAngle = toAngle(end);
    const sweep = Math.abs(endAngle - startAngle);
    if (sweep === 0) return null;

    const duration = Math.abs(end - start);
    const largeArc = sweep > Math.PI ? 1 : 0;
    const fill = pickTaskColor(task, start);
    let pathData = '';

    if (use24Hour) {
      // 24h: use outer ring bands
      let ringRadius = outerRadius;
      const ringThickness = 16;
      if (duration > 3) ringRadius = outerRadius - 34;
      else if (duration >= 1) ringRadius = outerRadius - 16;
      const iR = ringRadius - ringThickness;

      const oSX = center + ringRadius * Math.cos(startAngle);
      const oSY = center + ringRadius * Math.sin(startAngle);
      const oEX = center + ringRadius * Math.cos(endAngle);
      const oEY = center + ringRadius * Math.sin(endAngle);

      const iSX = center + iR * Math.cos(startAngle);
      const iSY = center + iR * Math.sin(startAngle);
      const iEX = center + iR * Math.cos(endAngle);
      const iEY = center + iR * Math.sin(endAngle);

      pathData = `M${oSX},${oSY}
                  A${ringRadius},${ringRadius} 0 ${largeArc} 1 ${oEX},${oEY}
                  L${iEX},${iEY}
                  A${iR},${iR} 0 ${largeArc} 0 ${iSX},${iSY}
                  Z`;
    } else {
      // 12h mode
      if (task.hourGroup === 'AM') {
        // AM: thin donut outer ring
        const ringRadius = outerRadius-35;
        const ringThickness = 30; // thinner than 24h band
        const iR = ringRadius - ringThickness;

        const oSX = center + ringRadius * Math.cos(startAngle);
        const oSY = center + ringRadius * Math.sin(startAngle);
        const oEX = center + ringRadius * Math.cos(endAngle);
        const oEY = center + ringRadius * Math.sin(endAngle);

        const iSX = center + iR * Math.cos(startAngle);
        const iSY = center + iR * Math.sin(startAngle);
        const iEX = center + iR * Math.cos(endAngle);
        const iEY = center + iR * Math.sin(endAngle);

        pathData = `M${oSX},${oSY}
                    A${ringRadius},${ringRadius} 0 ${largeArc} 1 ${oEX},${oEY}
                    L${iEX},${iEY}
                    A${iR},${iR} 0 ${largeArc} 0 ${iSX},${iSY}
                    Z`;
      } else {
        // PM: wedge from center, radius scales 80%..100% by duration
        const scale = mapRange(duration, 0.25, 6, 0.6, 0.8);
        const r = innerRadius * scale;

        const sx = center + r * Math.cos(startAngle);
        const sy = center + r * Math.sin(startAngle);
        const ex = center + r * Math.cos(endAngle);
        const ey = center + r * Math.sin(endAngle);

        pathData = `M${center},${center}
                    L${sx},${sy}
                    A${r},${r} 0 ${largeArc} 1 ${ex},${ey}
                    Z`;
      }
    }

    return <path key={task.id ?? index} d={pathData} fill={fill} opacity="0.9" />;
  };

  return <>{tasks.map(renderTask)}</>;
};

export default TaskRenderer;
