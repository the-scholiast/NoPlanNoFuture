'use client';
import React from 'react';
import type { Task } from './types';

interface RadialClockProps {
  isDarkMode: boolean;
  outerRadius: number;
  innerRadius: number;
  center: number;
  tasks: Task[];
  use24Hour: boolean;
}

const RadialClock: React.FC<RadialClockProps> = ({ 
  isDarkMode, 
  outerRadius, 
  innerRadius, 
  center, 
  tasks,
  use24Hour
}) => {
  // 24-hour mode: Three rings design - REORDERED
  const render24HourInnermostRing = () => {
    const marks = [];
    const offset = -Math.PI / 2; // Start from top (00:00)
    const innermostRadius = outerRadius - 40; // 40px from outer edge

    for (let hour = 0; hour < 24; hour++) {
      const angle = (hour / 12) * Math.PI + offset;
      
      const markLength = 20; // Unified tick length for all rings
      const strokeWidth = 1.5; // Thinner marks

      const outerX = center + innermostRadius * Math.cos(angle);
      const outerY = center + innermostRadius * Math.sin(angle);
      const innerX = center + (innermostRadius - markLength) * Math.cos(angle);
      const innerY = center + (innermostRadius - markLength) * Math.sin(angle);

      marks.push(
        <line
          key={`24h-innermost-hour-${hour}`}
          x1={outerX}
          y1={outerY}
          x2={innerX}
          y2={innerY}
          stroke={isDarkMode ? "#e2e8f0" : "#2d3748"}
          strokeWidth={strokeWidth}
          opacity="0.9"
        />
      );
    }

    return marks;
  };

  const render24HourMiddleRing = () => {
    const marks = [];
    const offset = -Math.PI / 2;
    const middleRadius = outerRadius - 20; // 20px from outer edge

    for (let hour = 0; hour < 24; hour++) {
      // Add hour marks (整點刻度) to middle ring
      const hourAngle = (hour / 12) * Math.PI + offset;
      const hourMarkLength = 20; // Unified tick length for all rings
      const hourStrokeWidth = 1.5; // Thinner marks

      const hourOuterX = center + middleRadius * Math.cos(hourAngle);
      const hourOuterY = center + middleRadius * Math.sin(hourAngle);
      const hourInnerX = center + (middleRadius - hourMarkLength) * Math.cos(hourAngle);
      const hourInnerY = center + (middleRadius - hourMarkLength) * Math.sin(hourAngle);

      marks.push(
        <line
          key={`24h-middle-hour-${hour}`}
          x1={hourOuterX}
          y1={hourOuterY}
          x2={hourInnerX}
          y2={hourInnerY}
          stroke={isDarkMode ? "#e2e8f0" : "#2d3748"}
          strokeWidth={hourStrokeWidth}
          opacity="0.8"
        />
      );

      // Add 10-minute marks
      for (let minute = 1; minute < 6; minute++) {
        const angle = ((hour + minute / 6) / 12) * Math.PI + offset;
        
        const markLength = 20; // Unified tick length for all rings
        const strokeWidth = 1.2; // Thinner marks

        const outerX = center + middleRadius * Math.cos(angle);
        const outerY = center + middleRadius * Math.sin(angle);
        const innerX = center + (middleRadius - markLength) * Math.cos(angle);
        const innerY = center + (middleRadius - markLength) * Math.sin(angle);

        marks.push(
          <line
            key={`24h-middle-10min-${hour}-${minute}`}
            x1={outerX}
            y1={outerY}
            x2={innerX}
            y2={innerY}
            stroke={isDarkMode ? "#a0aec0" : "#718096"}
            strokeWidth={strokeWidth}
            opacity="0.6"
          />
        );
      }
    }

    return marks;
  };

  const render24HourOutermostRing = () => {
    const marks = [];
    const offset = -Math.PI / 2;
    const outermostRadius = outerRadius; // Right at the clock edge

    for (let hour = 0; hour < 24; hour++) {
      // Add hour marks (整點刻度) to outermost ring
      const hourAngle = (hour / 12) * Math.PI + offset;
      const hourMarkLength = 20; // Unified tick length for all rings
      const hourStrokeWidth = 1.5; // Thinner marks

      const hourOuterX = center + outermostRadius * Math.cos(hourAngle);
      const hourOuterY = center + outermostRadius * Math.sin(hourAngle);
      const hourInnerX = center + (outermostRadius - hourMarkLength) * Math.cos(hourAngle);
      const hourInnerY = center + (outermostRadius - hourMarkLength) * Math.sin(hourAngle);

      marks.push(
        <line
          key={`24h-outermost-hour-${hour}`}
          x1={hourOuterX}
          y1={hourOuterY}
          x2={hourInnerX}
          y2={hourInnerY}
          stroke={isDarkMode ? "#e2e8f0" : "#2d3748"}
          strokeWidth={hourStrokeWidth}
          opacity="0.8"
        />
      );

      // Add 5-minute marks
      for (let minute = 1; minute < 12; minute++) {
        const angle = ((hour + minute / 12) / 12) * Math.PI + offset;
        
        const markLength = 20; // Unified tick length for all rings
        const strokeWidth = 1; // Thinner marks

        const outerX = center + outermostRadius * Math.cos(angle);
        const outerY = center + outermostRadius * Math.sin(angle);
        const innerX = center + (outermostRadius - markLength) * Math.cos(angle);
        const innerY = center + (outermostRadius - markLength) * Math.sin(angle);

        marks.push(
          <line
            key={`24h-outermost-5min-${hour}-${minute}`}
            x1={outerX}
            y1={outerY}
            x2={innerX}
            y2={innerY}
            stroke={isDarkMode ? "#cbd5e0" : "#a0aec0"}
            strokeWidth={strokeWidth}
            opacity="0.4"
          />
        );
      }
    }

    return marks;
  };

  // 24-hour numbers around the circle - MOVED OUTSIDE
  const render24HourNumbers = () => {
    const numbers = [];
    const offset = -Math.PI / 2;
    const numberRadius = outerRadius + 45; // Moved further outside

    for (let hour = 0; hour < 24; hour++) {
      const angle = (hour / 12) * Math.PI + offset;
      const x = center + numberRadius * Math.cos(angle);
      const y = center + numberRadius * Math.sin(angle);

      const displayHour = hour.toString().padStart(2, '0');

      numbers.push(
        <text
          key={`24h-number-${hour}`}
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="14"
          fill={isDarkMode ? '#e2e8f0' : '#2d3748'}
          fontWeight="600"
          opacity="0.9"
        >
          {displayHour}
        </text>
      );
    }

    return numbers;
  };

  // 12-hour mode: Double layer design
  const render12HourOuterMarks = () => {
    const marks = [];
    const offset = -Math.PI / 2; // Start from top (12 AM)

    for (let hour = 0; hour < 12; hour++) {
      const angle = (hour / 6) * Math.PI + offset;
      const isMainHour = hour % 3 === 0; // Every 3 hours a main mark

      const markLength = 20; // Unified tick length for all rings
      const strokeWidth = 1.5; // Thinner marks

      const outerX = center + outerRadius * Math.cos(angle);
      const outerY = center + outerRadius * Math.sin(angle);
      const innerX = center + (outerRadius - markLength) * Math.cos(angle);
      const innerY = center + (outerRadius - markLength) * Math.sin(angle);

      marks.push(
        <line
          key={`12h-outer-hour-mark-${hour}`}
          x1={outerX}
          y1={outerY}
          x2={innerX}
          y2={innerY}
          stroke={isDarkMode ? "#e2e8f0" : "#2d3748"}
          strokeWidth={strokeWidth}
          opacity="0.8"
        />
      );
    }

    return marks;
  };

  const render12HourOuterMinuteMarks = () => {
    const marks = [];
    const offset = -Math.PI / 2;

    for (let hour = 0; hour < 12; hour++) {
      for (let minute = 1; minute < 2; minute++) { // Only 30-minute mark
        const angle = ((hour + minute / 2) / 6) * Math.PI + offset;
        
        const markLength = 20; // Unified tick length for all rings
        const strokeWidth = 1.2; // Thinner marks

        const outerX = center + outerRadius * Math.cos(angle);
        const outerY = center + outerRadius * Math.sin(angle);
        const innerX = center + (outerRadius - markLength) * Math.cos(angle);
        const innerY = center + (outerRadius - markLength) * Math.sin(angle);

        marks.push(
          <line
            key={`12h-outer-minute-mark-${hour}-${minute}`}
            x1={outerX}
            y1={outerY}
            x2={innerX}
            y2={innerY}
            stroke={isDarkMode ? "#a0aec0" : "#718096"}
            strokeWidth={strokeWidth}
            opacity="0.6"
          />
        );
      }
    }

    return marks;
  };

  const render12HourOuterNumbers = () => {
    const numbers = [];
    const offset = -Math.PI / 2;
    const numberRadius = outerRadius + 50; // Moved further outside

    for (let hour = 0; hour < 12; hour++) {
      const angle = (hour / 6) * Math.PI + offset;
      const x = center + numberRadius * Math.cos(angle);
      const y = center + numberRadius * Math.sin(angle);

      const displayHour = hour === 0 ? 12 : hour;
      const ampm = hour === 0 ? 'AM' : hour < 6 ? 'AM' : 'PM';

      numbers.push(
        <g key={`12h-outer-hour-${hour}`}>
          <text
            x={x}
            y={y - 8}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="16"
            fill={isDarkMode ? '#e2e8f0' : '#2d3748'}
            fontWeight="700"
            opacity="0.9"
          >
            {displayHour}
          </text>
          <text
            x={x}
            y={y + 8}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
            fill={isDarkMode ? '#a0aec0' : '#718096'}
            fontWeight="500"
            opacity="0.8"
          >
            {ampm}
          </text>
        </g>
      );
    }

    return numbers;
  };

  const render12HourInnerMarks = () => {
    const marks = [];
    const offset = -Math.PI / 2;

    for (let hour = 0; hour < 12; hour++) {
      const angle = (hour / 6) * Math.PI + offset;
      
      const markLength = 20; // Unified tick length for all rings
      const strokeWidth = 1.5; // Thinner marks

      const outerX = center + innerRadius * Math.cos(angle);
      const outerY = center + innerRadius * Math.sin(angle);
      const innerX = center + (innerRadius - markLength) * Math.cos(angle);
      const innerY = center + (innerRadius - markLength) * Math.sin(angle);

      marks.push(
        <line
          key={`12h-inner-hour-mark-${hour}`}
          x1={outerX}
          y1={outerY}
          x2={innerX}
          y2={innerY}
          stroke={isDarkMode ? "#a0aec0" : "#718096"}
          strokeWidth={strokeWidth}
          opacity="0.7"
        />
      );
    }

    return marks;
  };

  const render12HourInnerNumbers = () => {
    const numbers = [];
    const offset = -Math.PI / 2;
    const numberRadius = innerRadius - 35;

    for (let hour = 0; hour < 12; hour++) {
      const angle = (hour / 6) * Math.PI + offset;
      const x = center + numberRadius * Math.cos(angle);
      const y = center + numberRadius * Math.sin(angle);

      const displayHour = hour === 0 ? 12 : hour;

      numbers.push(
        <text
          key={`12h-inner-hour-${hour}`}
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="12"
          fill={isDarkMode ? '#e2e8f0' : '#2d3748'}
          fontWeight="600"
          opacity="0.8"
        >
          {displayHour}
        </text>
      );
    }

    return numbers;
  };

  return (
    <>
      {use24Hour ? (
        // 24-hour mode - three rings REORDERED
        <>
          {/* Innermost ring - Hour marks (was outer ring) */}
          <circle
            cx={center}
            cy={center}
            r={outerRadius - 40}
            fill="transparent"
            stroke="none"
          />
          
          {/* Middle ring - 10-minute marks */}
          <circle
            cx={center}
            cy={center}
            r={outerRadius - 20}
            fill="transparent"
            stroke="none"
          />
          
          {/* Outermost ring - 5-minute marks (was inner ring) */}
          <circle
            cx={center}
            cy={center}
            r={outerRadius}
            fill="transparent"
            stroke="none"
          />
          
          {/* Time marks and numbers - REORDERED */}
          {render24HourInnermostRing()}
          {render24HourMiddleRing()}
          {render24HourOutermostRing()}
          {render24HourNumbers()}
        </>
      ) : (
        // 12-hour mode - double layer
        <>
          {/* Outer ring - Donut shape for 12am-12pm - no fill, no border */}
          <circle
            cx={center}
            cy={center}
            r={outerRadius}
            fill="transparent"
            stroke="none"
          />
          
          {/* Inner ring - Pie chart style - no fill, no border */}
          <circle
            cx={center}
            cy={center}
            r={innerRadius}
            fill="transparent"
            stroke="none"
          />
          
          {/* 12-hour time marks and numbers */}
          {render12HourOuterMinuteMarks()}
          {render12HourOuterMarks()}
          {render12HourOuterNumbers()}
          {render12HourInnerMarks()}
          {render12HourInnerNumbers()}
        </>
      )}
      
      {/* Center point - REMOVED for 24-hour mode */}
      {!use24Hour && (
        <circle
          cx={center}
          cy={center}
          r="8"
          fill={isDarkMode ? '#e2e8f0' : '#2d3748'}
          stroke="none"
        />
      )}
    </>
  );
};

export default RadialClock;
