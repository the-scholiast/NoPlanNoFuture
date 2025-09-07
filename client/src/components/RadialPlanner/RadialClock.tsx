'use client';
import React from 'react';
import type { Task } from './types';

interface RadialClockProps {
  isDarkMode: boolean;
  outerRadius: number;
  innerRadius: number;
  center: number;
  tasks: Task[];        // kept for compatibility
  use24Hour: boolean;
}

const RadialClock: React.FC<RadialClockProps> = ({
  isDarkMode,
  outerRadius,
  center,
  use24Hour,
}) => {
  // ----- visual constants -----
  const RIM_SW = 2;                   // clock rim stroke width
  const HOUR_LEN_OUTER = 24;          // outer ring hour tick length
  const MIN5_LEN_OUTER = 14;          // outer ring 5-min tick length
  const HOUR_LEN_MID = 20;
  const MIN10_LEN_MID = 12;
  const HOUR_LEN_INNER = 18;

  const HOUR_SW_OUTER = 2.0;
  const MIN5_SW_OUTER = 1.4;
  const HOUR_SW_MID = 1.9;
  const MIN10_SW_MID = 1.3;
  const HOUR_SW_INNER = 1.8;

  const offset = -Math.PI / 2;        // start at 12 o'clock (top)

  // Rim (reference circle). Ticks will "kiss" this line exactly.
  const Outline = () => (
    <circle
      cx={center}
      cy={center}
      r={outerRadius - RIM_SW / 2}
      fill="none"
      stroke={isDarkMode ? '#e2e8f0' : '#2d3748'}
      strokeWidth={RIM_SW}
      opacity={0.28}
      vectorEffect="non-scaling-stroke"
      strokeLinecap="round"
    />
  );

  // ===== 24H mode =====
  const render24HourInnermostRing = (): React.ReactElement[] => {
    const marks: React.ReactElement[] = [];
    const r = outerRadius - 40;

    for (let h = 0; h < 24; h++) {
      const a = (h / 24) * 2 * Math.PI + offset;

      const x1 = center + r * Math.cos(a);
      const y1 = center + r * Math.sin(a);
      const x2 = center + (r - HOUR_LEN_INNER) * Math.cos(a);
      const y2 = center + (r - HOUR_LEN_INNER) * Math.sin(a);

      marks.push(
        <line
          key={`24-in-${h}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={isDarkMode ? '#e2e8f0' : '#2d3748'}
          strokeWidth={HOUR_SW_INNER}
          opacity={0.9}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
        />,
      );
    }
    return marks;
  };

  const render24HourMiddleRing = (): React.ReactElement[] => {
    const marks: React.ReactElement[] = [];
    const r = outerRadius - 20;

    for (let h = 0; h < 24; h++) {
      const ha = (h / 24) * 2 * Math.PI + offset;

      // hour tick
      {
        const x1 = center + r * Math.cos(ha);
        const y1 = center + r * Math.sin(ha);
        const x2 = center + (r - HOUR_LEN_MID) * Math.cos(ha);
        const y2 = center + (r - HOUR_LEN_MID) * Math.sin(ha);

        marks.push(
          <line
            key={`24-mid-h-${h}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={isDarkMode ? '#e2e8f0' : '#2d3748'}
            strokeWidth={HOUR_SW_MID}
            opacity={0.85}
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
          />,
        );
      }

      // 10-minute ticks (6 between each hour)
      for (let m = 1; m < 6; m++) {
        const a = ((h + m / 6) / 24) * 2 * Math.PI + offset;

        const x1 = center + r * Math.cos(a);
        const y1 = center + r * Math.sin(a);
        const x2 = center + (r - MIN10_LEN_MID) * Math.cos(a);
        const y2 = center + (r - MIN10_LEN_MID) * Math.sin(a);

        marks.push(
          <line
            key={`24-mid-10-${h}-${m}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={isDarkMode ? '#b8c2cc' : '#4a5568'}
            strokeWidth={MIN10_SW_MID}
            opacity={0.7}
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
          />,
        );
      }
    }
    return marks;
  };

  const render24HourOutermostRing = (): React.ReactElement[] => {
    const marks: React.ReactElement[] = [];
    // Tick marks start exactly at the clock edge (from outerRadius)
    const r = outerRadius;

    for (let h = 0; h < 24; h++) {
      const ha = (h / 24) * 2 * Math.PI + offset;

      // hour tick - starts from edge and goes inward
      {
        const x1 = center + r * Math.cos(ha);
        const y1 = center + r * Math.sin(ha);
        const x2 = center + (r - HOUR_LEN_OUTER) * Math.cos(ha);
        const y2 = center + (r - HOUR_LEN_OUTER) * Math.sin(ha);

        marks.push(
          <line
            key={`24-out-h-${h}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={isDarkMode ? '#e2e8f0' : '#2d3748'}
            strokeWidth={HOUR_SW_OUTER}
            opacity={0.95}
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
          />,
        );
      }

      // 5-minute ticks (12 between each hour) - starts from edge and goes inward
      for (let m = 1; m < 12; m++) {
        const a = ((h + m / 12) / 24) * 2 * Math.PI + offset;

        const x1 = center + r * Math.cos(a);
        const y1 = center + r * Math.sin(a);
        const x2 = center + (r - MIN5_LEN_OUTER) * Math.cos(a);
        const y2 = center + (r - MIN5_LEN_OUTER) * Math.sin(a);

        marks.push(
          <line
            key={`24-out-5-${h}-${m}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={isDarkMode ? '#cbd5e0' : '#718096'}
            strokeWidth={MIN5_SW_OUTER}
            opacity={0.62}
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
          />,
        );
      }
    }
    return marks;
  };

  // Numbers 1-24 placed outside the ring (outside the clock edge)
  const render24HourNumbers = (): React.ReactElement[] => {
    const nodes: React.ReactElement[] = [];
    const r = outerRadius + 16; // Number position outside the edge

    for (let h = 0; h < 24; h++) {
      const a = (h / 24) * 2 * Math.PI + offset;
      const x = center + r * Math.cos(a);
      const y = center + r * Math.sin(a);

      // Display 1-24 instead of 0-23
      const displayHour = h === 0 ? 24 : h;

      nodes.push(
        <text
          key={`24-num-${h}`}
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={12}
          fill={isDarkMode ? '#e2e8f0' : '#2d3748'}
          fontWeight={600}
          opacity={0.9}
          style={{ userSelect: 'none' }}
        >
          {displayHour}
        </text>,
      );
    }
    return nodes;
  };

  // ===== 12H mode (three-ring layout, same as 24H) =====
  const render12HourInnermostRing = (): React.ReactElement[] => {
    const marks: React.ReactElement[] = [];
    const r = outerRadius - 40;

    for (let h = 0; h < 12; h++) {
      const a = (h / 6) * Math.PI + offset;

      const x1 = center + r * Math.cos(a);
      const y1 = center + r * Math.sin(a);
      const x2 = center + (r - HOUR_LEN_INNER) * Math.cos(a);
      const y2 = center + (r - HOUR_LEN_INNER) * Math.sin(a);

      marks.push(
        <line
          key={`12-in-${h}`}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={isDarkMode ? '#e2e8f0' : '#2d3748'}
          strokeWidth={HOUR_SW_INNER}
          opacity={0.9}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="round"
        />,
      );
    }
    return marks;
  };

  const render12HourMiddleRing = (): React.ReactElement[] => {
    const marks: React.ReactElement[] = [];
    const r = outerRadius - 20;

    for (let h = 0; h < 12; h++) {
      const ha = (h / 6) * Math.PI + offset;

      // hour tick
      {
        const x1 = center + r * Math.cos(ha);
        const y1 = center + r * Math.sin(ha);
        const x2 = center + (r - HOUR_LEN_MID) * Math.cos(ha);
        const y2 = center + (r - HOUR_LEN_MID) * Math.sin(ha);

        marks.push(
          <line
            key={`12-mid-h-${h}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={isDarkMode ? '#e2e8f0' : '#2d3748'}
            strokeWidth={HOUR_SW_MID}
            opacity={0.85}
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
          />,
        );
      }

      // 10-minute ticks (6 between each hour)
      for (let m = 1; m < 6; m++) {
        const a = ((h + m / 6) / 6) * Math.PI + offset;

        const x1 = center + r * Math.cos(a);
        const y1 = center + r * Math.sin(a);
        const x2 = center + (r - MIN10_LEN_MID) * Math.cos(a);
        const y2 = center + (r - MIN10_LEN_MID) * Math.sin(a);

        marks.push(
          <line
            key={`12-mid-10-${h}-${m}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={isDarkMode ? '#b8c2cc' : '#4a5568'}
            strokeWidth={MIN10_SW_MID}
            opacity={0.7}
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
          />,
        );
      }
    }
    return marks;
  };

  const render12HourOutermostRing = (): React.ReactElement[] => {
    const marks: React.ReactElement[] = [];
    // Tick marks completely touch the clock edge
    const r = outerRadius;

    for (let h = 0; h < 12; h++) {
      const ha = (h / 6) * Math.PI + offset;

      // hour tick - starts from edge and goes inward
      {
        const x1 = center + r * Math.cos(ha);
        const y1 = center + r * Math.sin(ha);
        const x2 = center + (r - HOUR_LEN_OUTER) * Math.cos(ha);
        const y2 = center + (r - HOUR_LEN_OUTER) * Math.sin(ha);

        marks.push(
          <line
            key={`12-out-h-${h}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={isDarkMode ? '#e2e8f0' : '#2d3748'}
            strokeWidth={HOUR_SW_OUTER}
            opacity={0.95}
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
          />,
        );
      }

      // 5-minute ticks (12 between each hour)
      for (let m = 1; m < 12; m++) {
        const a = ((h + m / 12) / 6) * Math.PI + offset;

        const x1 = center + r * Math.cos(a);
        const y1 = center + r * Math.sin(a);
        const x2 = center + (r - MIN5_LEN_OUTER) * Math.cos(a);
        const y2 = center + (r - MIN5_LEN_OUTER) * Math.sin(a);

        marks.push(
          <line
            key={`12-out-5-${h}-${m}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={isDarkMode ? '#cbd5e0' : '#718096'}
            strokeWidth={MIN5_SW_OUTER}
            opacity={0.62}
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
          />,
        );
      }
    }
    return marks;
  };

  // Numbers 1-12 displayed on outer ring
  const render12HourNumbers = (): React.ReactElement[] => {
    const nodes: React.ReactElement[] = [];
    const r = outerRadius + 16;

    for (let h = 0; h < 12; h++) {
      const a = (h / 6) * Math.PI + offset;
      const x = center + r * Math.cos(a);
      const y = center + r * Math.sin(a);

      // Display 1-12
      const displayHour = h === 0 ? 12 : h;

      nodes.push(
        <text
          key={`12-num-${h}`}
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={12}
          fill={isDarkMode ? '#e2e8f0' : '#2d3748'}
          fontWeight={600}
          opacity={0.9}
          style={{ userSelect: 'none' }}
        >
          {displayHour}
        </text>,
      );
    }
    return nodes;
  };

  return (
    <>
      {/* anchor rim - clock border */}
      <Outline />

      {use24Hour ? (
        <>
          {/* guide circles to reserve layout (no stroke) */}
          <circle cx={center} cy={center} r={outerRadius - 40} fill="transparent" />
          <circle cx={center} cy={center} r={outerRadius - 20} fill="transparent" />
          <circle cx={center} cy={center} r={outerRadius} fill="transparent" />

          {render24HourInnermostRing()}
          {render24HourMiddleRing()}
          {render24HourOutermostRing()}
          {render24HourNumbers()}
        </>
      ) : (
        <>
          {/* guide circles to reserve layout (no stroke) */}
          <circle cx={center} cy={center} r={outerRadius - 40} fill="transparent" />
          <circle cx={center} cy={center} r={outerRadius - 20} fill="transparent" />
          <circle cx={center} cy={center} r={outerRadius} fill="transparent" />

          {render12HourInnermostRing()}
          {render12HourMiddleRing()}
          {render12HourOutermostRing()}
          {render12HourNumbers()}
        </>
      )}
    </>
  );
};

export default RadialClock;