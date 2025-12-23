'use client'

import { useMemo } from 'react'
import type { TimetableTask } from '@/lib/api/timetableApi'

interface HourlyData {
  hour: number
  hours: number
}

interface Props {
  tasks: TimetableTask[]
  isDark: boolean
}

const parseHours = (start?: string, end?: string): number => {
  if (!start || !end) return 0
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const mins = (eh * 60 + em) - (sh * 60 + sm)
  return Math.max(0, mins) / 60
}

export function HourlyHeatmap({ tasks, isDark }: Props) {
  // Calculate hours worked per hour of day (0-23)
  const hourlyData = useMemo(() => {
    const hourMap = new Map<number, number>()
    
    // Initialize all 24 hours with 0
    for (let i = 0; i < 24; i++) {
      hourMap.set(i, 0)
    }
    
    // Aggregate work hours by hour of day
    tasks.forEach(task => {
      // Filter out secondary tasks that shouldn't be counted in stats
      if (task.is_secondary && !task.count_in_stats) return
      if (!task.start_time || !task.end_time) return
      
      const [startHour, startMin] = task.start_time.split(':').map(Number)
      const [endHour, endMin] = task.end_time.split(':').map(Number)
      const startMinutes = startHour * 60 + startMin
      const endMinutes = endHour * 60 + endMin
      const duration = parseHours(task.start_time, task.end_time)
      
      // Distribute work time across hours
      for (let hour = 0; hour < 24; hour++) {
        const hourStartMinutes = hour * 60
        const hourEndMinutes = (hour + 1) * 60
        
        // Calculate overlap between task and this hour
        const overlapStart = Math.max(startMinutes, hourStartMinutes)
        const overlapEnd = Math.min(endMinutes, hourEndMinutes)
        const overlapMinutes = Math.max(0, overlapEnd - overlapStart)
        
        if (overlapMinutes > 0) {
          const overlapHours = overlapMinutes / 60
          hourMap.set(hour, (hourMap.get(hour) || 0) + overlapHours)
        }
      }
    })
    
    return Array.from(hourMap.entries())
      .map(([hour, hours]) => ({ hour, hours }))
      .sort((a, b) => a.hour - b.hour)
  }, [tasks])
  
  // Find max hours for normalization
  const maxHours = useMemo(() => {
    return Math.max(...hourlyData.map(d => d.hours), 0.1) // At least 0.1 to avoid division by zero
  }, [hourlyData])
  
  // Color gradient function with more levels
  const getColor = (hours: number, maxHours: number): string => {
    if (hours === 0) return isDark ? '#1f2937' : '#f3f4f6'
    const intensity = Math.min(hours / maxHours, 1)
    
    // Use a smoother gradient with more color levels
    // Apply easing function for better visual distribution
    const easedIntensity = intensity * intensity * (3 - 2 * intensity) // Smoothstep function
    
    if (isDark) {
      // Dark mode: lighter colors for more hours
      // More levels: from dark gray to bright blue
      const r = Math.round(31 + (96 - 31) * easedIntensity) // 31 to 96
      const g = Math.round(41 + (165 - 41) * easedIntensity) // 41 to 165
      const b = Math.round(55 + (250 - 55) * easedIntensity) // 55 to 250
      return `rgb(${r}, ${g}, ${b})`
    } else {
      // Light mode: darker colors for more hours
      // More levels: from light blue to dark blue
      const r = Math.round(219 + (37 - 219) * easedIntensity) // 219 to 37
      const g = Math.round(234 + (99 - 234) * easedIntensity) // 234 to 99
      const b = Math.round(254 + (235 - 254) * easedIntensity) // 254 to 235
      return `rgb(${r}, ${g}, ${b})`
    }
  }
  
  return (
    <div className="w-full">
      <div className="grid gap-0.5 mb-6" style={{ gridTemplateColumns: 'repeat(24, minmax(0, 1fr))' }}>
        {hourlyData.map(({ hour, hours }) => {
          const color = getColor(hours, maxHours)
          
          return (
            <div
              key={hour}
              className="relative group"
            >
              <div
                className={`w-full h-6 rounded transition-all hover:scale-110 cursor-pointer flex items-center justify-center ${
                  isDark ? 'border border-gray-700' : 'border border-gray-300'
                }`}
                style={{ backgroundColor: color }}
                title={`${hour === 0 ? '12:00 AM' : hour < 12 ? `${hour}:00 AM` : hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`} - ${hour + 1 === 24 ? '12:00 AM' : hour + 1 < 12 ? `${hour + 1}:00 AM` : hour + 1 === 12 ? '12:00 PM' : `${hour + 1 - 12}:00 PM`} | ${hours.toFixed(2)} hours`}
              >
                <div className="text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity text-center">
                  {hours > 0 && `${hours.toFixed(1)}h`}
                </div>
              </div>
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-[9px] text-muted-foreground whitespace-nowrap">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
            </div>
          )
        })}
      </div>
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-0.5">
          {[0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1].map((intensity) => {
            const color = getColor(intensity * maxHours, maxHours)
            return (
              <div
                key={intensity}
                className={`w-3 h-3 rounded ${
                  isDark ? 'border border-gray-700' : 'border border-gray-300'
                }`}
                style={{ backgroundColor: color }}
              />
            )
          })}
        </div>
        <span>More</span>
      </div>
    </div>
  )
}
