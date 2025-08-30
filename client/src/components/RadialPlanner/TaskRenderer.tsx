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

const TaskRenderer: React.FC<TaskRendererProps> = ({ 
  tasks, 
  isDarkMode, 
  outerRadius, 
  innerRadius, 
  center,
  use24Hour
}) => {
  // Convert to appropriate hour format
  const convertToDisplayHour = (hour: number, hourGroup: 'AM' | 'PM'): number => {
    if (use24Hour) {
      // 24-hour mode
      if (hourGroup === 'PM' && hour !== 12) {
        return hour + 12;
      }
      if (hourGroup === 'AM' && hour === 12) {
        return 0;
      }
      return hour;
    } else {
      // 12-hour mode
      if (hourGroup === 'PM' && hour !== 12) {
        return hour;
      }
      if (hourGroup === 'AM' && hour === 12) {
        return 0;
      }
      return hour;
    }
  };

  // Render single task
  const renderTask = (task: Task, index: number) => {
    const offset = -Math.PI / 2; // Start from top
    
    // Convert to display hour format
    const startHour = convertToDisplayHour(task.start, task.hourGroup);
    const endHour = convertToDisplayHour(task.end, task.hourGroup);
    
    // Handle cross-period tasks
    let startAngle, endAngle;
    if (use24Hour) {
      // 24-hour mode
      if (endHour < startHour) {
        // Cross-day task, e.g., 23:00 to 02:00
        startAngle = (startHour / 12) * Math.PI + offset;
        endAngle = (endHour / 12) * Math.PI + offset;
      } else {
        startAngle = (startHour / 12) * Math.PI + offset;
        endAngle = (endHour / 12) * Math.PI + offset;
      }
    } else {
      // 12-hour mode
      if (endHour < startHour) {
        // Cross-period task, e.g., 11:00 to 2:00
        startAngle = (startHour / 6) * Math.PI + offset;
        endAngle = (endHour / 6) * Math.PI + offset;
      } else {
        startAngle = (startHour / 6) * Math.PI + offset;
        endAngle = (endHour / 6) * Math.PI + offset;
      }
    }

    const duration = Math.abs(endHour - startHour);
    if (duration === 0) return null; // Skip tasks with 0 duration

    // Determine task display area
    let pathData;
    let taskRadius;

    if (use24Hour) {
      // 24-hour mode - three rings with task distribution based on duration
      let ringRadius, ringThickness;
      
      if (duration > 3) {
        // Long tasks (>3 hours) - innermost ring
        ringRadius = outerRadius - 40;
        ringThickness = 20;
      } else if (duration >= 1 && duration <= 3) {
        // Medium tasks (1-3 hours) - middle ring
        ringRadius = outerRadius - 20;
        ringThickness = 20;
      } else {
        // Short tasks (<1 hour) - outermost ring
        ringRadius = outerRadius;
        ringThickness = 20;
      }
      
      // Create ring path (donut shape)
      const outerStartX = center + ringRadius * Math.cos(startAngle);
      const outerStartY = center + ringRadius * Math.sin(startAngle);
      const outerEndX = center + ringRadius * Math.cos(endAngle);
      const outerEndY = center + ringRadius * Math.sin(endAngle);
      const innerStartX = center + (ringRadius - ringThickness) * Math.cos(startAngle);
      const innerStartY = center + (ringRadius - ringThickness) * Math.sin(startAngle);
      const innerEndX = center + (ringRadius - ringThickness) * Math.cos(endAngle);
      const innerEndY = center + (ringRadius - ringThickness) * Math.sin(endAngle);

      const largeArc = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;
      pathData = `M${outerStartX},${outerStartY} A${ringRadius},${ringRadius} 0 ${largeArc} 1 ${outerEndX},${outerEndY} L${innerEndX},${innerEndY} A${ringRadius - ringThickness},${ringRadius - ringThickness} 0 ${largeArc} 0 ${innerStartX},${innerStartY} Z`;
      
      taskRadius = ringRadius - ringThickness / 2;
    } else {
      // 12-hour mode - double layer
      const useOuterLayer = task.hourGroup === 'AM' && startHour < 6;
      
      if (useOuterLayer) {
        // Donut shape path (outer ring) - FIXED SIZE, no dynamic adjustment
        const donutThickness = 20; // Thinner outer ring
        const outerRingRadius = outerRadius - donutThickness / 2;
        const innerRingRadius = outerRadius - donutThickness;
        
        // Fixed radius for outer ring tasks
        taskRadius = (outerRingRadius + innerRingRadius) / 2;
        
        const outerStartX = center + outerRingRadius * Math.cos(startAngle);
        const outerStartY = center + outerRingRadius * Math.sin(startAngle);
        const outerEndX = center + outerRingRadius * Math.cos(endAngle);
        const outerEndY = center + outerRingRadius * Math.sin(endAngle);
        const innerStartX = center + innerRingRadius * Math.cos(startAngle);
        const innerStartY = center + innerRingRadius * Math.sin(startAngle);
        const innerEndX = center + innerRingRadius * Math.cos(endAngle);
        const innerEndY = center + innerRingRadius * Math.sin(endAngle);

        const largeArc = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;
        pathData = `M${outerStartX},${outerStartY} A${outerRingRadius},${outerRingRadius} 0 ${largeArc} 1 ${outerEndX},${outerEndY} L${innerEndX},${innerEndY} A${innerRingRadius},${innerRingRadius} 0 ${largeArc} 0 ${innerStartX},${innerStartY} Z`;
      } else {
        // Pie chart path (inner ring) with dynamic radius (80%-100%)
        const baseRadius = innerRadius * 0.8; // Start from 80% of inner radius
        const radiusExtension = Math.max(0, (duration - 1) * 8); // Extend radius based on duration
        taskRadius = Math.min(baseRadius + radiusExtension, innerRadius * 1.0); // Max 100% of inner radius
        
        const x1 = center;
        const y1 = center;
        const x2 = center + taskRadius * Math.cos(startAngle);
        const y2 = center + taskRadius * Math.sin(startAngle);
        const x3 = center + taskRadius * Math.cos(endAngle);
        const y3 = center + taskRadius * Math.sin(endAngle);

        const largeArc = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0;
        pathData = `M${x1},${y1} L${x2},${y2} A${taskRadius},${taskRadius} 0 ${largeArc} 1 ${x3},${y3} Z`;
      }
    }

    // Choose color based on time
    const taskColor = getTaskColor(startHour, duration, isDarkMode);

    return (
      <g key={`task-${index}`}>
        {/* Task area - no border */}
        <path
          d={pathData}
          fill={taskColor}
          stroke="none"
          opacity="0.9"
        />
      </g>
    );
  };

  // Choose color based on time and duration
  const getTaskColor = (startHour: number, duration: number, isDark: boolean): string => {
    const colors = [
      '#60a5fa', // Blue - early morning
      '#34d399', // Green - morning
      '#fbbf24', // Yellow - late morning
      '#fb923c', // Orange - early afternoon
      '#f87171', // Red - late afternoon
      '#a78bfa', // Purple - evening
      '#ec4899', // Pink - late evening
    ];

    // Choose color based on start time
    let colorIndex;
    if (use24Hour) {
      colorIndex = Math.floor(startHour / 3.5);
    } else {
      colorIndex = Math.floor(startHour / 2);
    }
    
    if (colorIndex >= colors.length) colorIndex = colors.length - 1;
    
    return colors[colorIndex];
  };

  return (
    <>
      {tasks.map((task, index) => renderTask(task, index))}
    </>
  );
};

export default TaskRenderer;
