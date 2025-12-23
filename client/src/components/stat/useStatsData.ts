'use client'

import { useMemo, useState, useCallback } from 'react'
import { useTheme } from 'next-themes'
import { useQuery } from '@tanstack/react-query'
import { timetableApi, type TimetableTask } from '@/lib/api/timetableApi'
import { formatDateString } from '@/lib/utils/dateUtils'

export type Period = 'all' | 'year' | 'month' | 'week'
export type ViewMode = 'day' | 'week' | 'month'

export interface BarPoint { date: string; hours: number }
export interface PieSlice { name: string; value: number; fill: string }

const parseHours = (start?: string, end?: string): number => {
  if (!start || !end) return 0
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const mins = (eh * 60 + em) - (sh * 60 + sm)
  return Math.max(0, mins) / 60
}

export function useStatsData() {
  const { theme } = useTheme()
  const [period, setPeriodState] = useState<Period>('week')
  const [viewMode, setViewMode] = useState<ViewMode>('day')
  const [customStart, setCustomStart] = useState<string>("")
  const [customEnd, setCustomEnd] = useState<string>("")

  // Wrapper to reset custom dates when period buttons are clicked
  const setPeriod = (p: Period) => {
    setPeriodState(p)
    // Reset custom dates when selecting predefined periods
    if (p === 'year' || p === 'month' || p === 'week' || p === 'all') {
      setCustomStart('')
      setCustomEnd('')
    }
  }

  const today = useMemo(() => new Date(), [])
  const endStrToday = useMemo(() => formatDateString(today), [today])
  const yearStartStr = useMemo(() => formatDateString(new Date(today.getFullYear(), 0, 1)), [today])
  const monthStartStr = useMemo(() => formatDateString(new Date(today.getFullYear(), today.getMonth(), 1)), [today])
  const weekStartStr = useMemo(() => {
    const d = new Date(today)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return formatDateString(new Date(d.setDate(diff)))
  }, [today])
  const allStartStr = '2000-01-01'

  const { startStr, endStrEffective, label } = useMemo(() => {
    if (customStart && customEnd) {
      const effEnd = customEnd > endStrToday ? endStrToday : customEnd
      return { startStr: customStart, endStrEffective: effEnd, label: 'Custom Range' }
    }
    switch (period) {
      case 'year':
        return { startStr: yearStartStr, endStrEffective: endStrToday, label: 'This Year' }
      case 'month':
        return { startStr: monthStartStr, endStrEffective: endStrToday, label: 'This Month' }
      case 'week':
        return { startStr: weekStartStr, endStrEffective: endStrToday, label: 'This Week' }
      case 'all':
      default:
        return { startStr: allStartStr, endStrEffective: endStrToday, label: 'All' }
    }
  }, [period, yearStartStr, monthStartStr, weekStartStr, customStart, customEnd, endStrToday])

  const { data: rangeTasks = [] } = useQuery({
    queryKey: ['stats','timetable','range', startStr, endStrEffective],
    queryFn: () => timetableApi.getScheduledTasks(startStr, endStrEffective),
    staleTime: 1000 * 60 * 5,
  })

  const { data: allTasks = [] } = useQuery({
    queryKey: ['stats','timetable','range','all', '2000-01-01', endStrToday],
    queryFn: () => timetableApi.getScheduledTasks('2000-01-01', endStrToday),
    staleTime: 1000 * 60 * 5,
  })

  const LIGHT_COLORS = ['#a5c4dd','#a7d3b2','#e2c897','#e7b8a2','#d6a7a7','#c0add9','#bfa8b6','#a7c9c2','#d3b8a7','#a7b2d3','#b0b8c2','#c2d3a7']
  const DARK_COLORS = ['#2f4a6d','#2f5d47','#6e5125','#6e3c25','#652b2b','#46356e','#5e3447','#333b47','#275550','#5c4326','#3e2f5c','#2f3a5c']
  const isDark = theme === 'dark'
  const palette = isDark ? DARK_COLORS : LIGHT_COLORS

  function normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[-_]/g, ' ')  // Replace hyphens and underscores with spaces
      .replace(/\s+/g, ' ')    // Collapse multiple spaces to single space
      .trim()
  }

  function getCanonicalName(originalNames: string[]): string {
    // Find the most common name (by frequency)
    const counts = new Map<string, number>()
    for (const name of originalNames) {
      counts.set(name, (counts.get(name) || 0) + 1)
    }
    
    // Prefer shorter names (base names) when they exist
    const sortedByLength = [...originalNames].sort((a, b) => a.length - b.length)
    const shortest = sortedByLength[0]
    
    // Return the most frequent name, or if tied, prefer shorter base name or proper capitalization
    let bestName = originalNames[0]
    let maxCount = counts.get(bestName) || 0
    
    for (const [name, count] of counts.entries()) {
      if (count > maxCount) {
        maxCount = count
        bestName = name
      } else if (count === maxCount) {
        // If tied, prefer shorter names (base names)
        if (name.length < bestName.length) {
          bestName = name
        } else if (name.length === bestName.length) {
          // If same length, prefer names with proper capitalization (first letter uppercase)
          const currentHasCap = /^[A-Z]/.test(name)
          const bestHasCap = /^[A-Z]/.test(bestName)
          if (currentHasCap && !bestHasCap) {
            bestName = name
          }
        }
      }
    }
    
    // If the shortest name is significantly shorter and appears at least once, prefer it
    if (shortest.length < bestName.length && shortest.length > 0 && counts.get(shortest)) {
      // Only use shortest if it's a clear base (at least 3 chars shorter or appears multiple times)
      const shortestCount = counts.get(shortest) || 0
      if (shortestCount >= 2 || (bestName.length - shortest.length >= 3)) {
        bestName = shortest
      }
    }
    
    return bestName
  }

  function getWeekKey(dateStr: string): string {
    const [y, m, d] = dateStr.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(date)
    monday.setDate(diff)
    const ky = monday.getFullYear()
    const km = String(monday.getMonth() + 1).padStart(2, '0')
    const kd = String(monday.getDate()).padStart(2, '0')
    return `${ky}-${km}-${kd}`
  }

  function getMonthKey(dateStr: string): string {
    const [y, m] = dateStr.split('-')
    return `${y}-${m}`
  }

  const barData: BarPoint[] = useMemo(() => {
    const map = new Map<string, number>()
    for (const t of rangeTasks) {
      // Filter out secondary tasks that shouldn't be counted in stats
      if (t.is_secondary && !t.count_in_stats) continue
      const dateKey = t.instance_date || t.start_date
      if (!dateKey) continue
      if (dateKey > endStrEffective) continue
      const h = parseHours(t.start_time, t.end_time)
      let bucket = dateKey
      if (viewMode === 'week') bucket = getWeekKey(dateKey)
      if (viewMode === 'month') bucket = getMonthKey(dateKey)
      map.set(bucket, (map.get(bucket) || 0) + h)
    }
    const entries = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
    let limited = entries
    if (period === 'week') limited = entries.slice(-7)
    if (period === 'month') limited = entries.slice(-31)
    if (period === 'all') limited = entries.slice(-60)
    return limited.map(([date, hours]) => ({ date, hours }))
  }, [rangeTasks, period, endStrEffective, viewMode])

  const pieData: PieSlice[] = useMemo(() => {
    // Map: normalizedKey -> { originalNames: Set, value: number, fill: string }
    const groupMap = new Map<string, { originalNames: Set<string>; value: number; fill: string }>()
    
    // First pass: group by normalized title
    for (const t of rangeTasks) {
      // Filter out secondary tasks that shouldn't be counted in stats
      if (t.is_secondary && !t.count_in_stats) continue
      const title = t.title || 'Untitled'
      const d = t.instance_date || t.start_date
      if (!d || d > endStrEffective) continue
      const h = parseHours(t.start_time, t.end_time)
      
      const normalizedKey = normalizeTitle(title)
      const existing = groupMap.get(normalizedKey)
      
      if (existing) {
        existing.originalNames.add(title)
        existing.value += h
      } else {
        // Always use palette based on current theme, ignore task custom colors
        const color = palette[groupMap.size % palette.length]
        groupMap.set(normalizedKey, {
          originalNames: new Set([title]),
          value: h,
          fill: color
        })
      }
    }
    
    // Second pass: merge groups where one is a substring of another
    const keysToMerge = new Map<string, string>() // targetKey -> sourceKey
    const allKeys = Array.from(groupMap.keys())
    
    for (let i = 0; i < allKeys.length; i++) {
      const key1 = allKeys[i]
      if (keysToMerge.has(key1)) continue // Already marked for merging
      
      for (let j = i + 1; j < allKeys.length; j++) {
        const key2 = allKeys[j]
        if (keysToMerge.has(key2)) continue // Already marked for merging
        
        // Check if one is a substring of the other
        // Prefer the shorter one as the base
        if (key1.includes(key2) || key2.includes(key1)) {
          const baseKey = key1.length <= key2.length ? key1 : key2
          const otherKey = key1.length <= key2.length ? key2 : key1
          
          // Only merge if:
          // 1. The shorter key is at least 3 characters and is a clear prefix, OR
          // 2. The shorter key is less than 3 characters but followed by a space in the longer key
          //    (meaning user did it on purpose, like "co" + " " in "co op")
          const isLongEnough = baseKey.length >= 3
          const hasIntentionalSpace = baseKey.length < 3 && otherKey.startsWith(baseKey + ' ')
          
          if (otherKey.startsWith(baseKey) && (isLongEnough || hasIntentionalSpace)) {
            keysToMerge.set(otherKey, baseKey)
          }
        }
      }
    }
    
    // Merge groups
    for (const [sourceKey, targetKey] of keysToMerge.entries()) {
      const sourceGroup = groupMap.get(sourceKey)
      const targetGroup = groupMap.get(targetKey)
      
      if (sourceGroup && targetGroup) {
        // Merge source into target
        for (const name of sourceGroup.originalNames) {
          targetGroup.originalNames.add(name)
        }
        targetGroup.value += sourceGroup.value
        groupMap.delete(sourceKey)
      }
    }
    
    // Convert to PieSlice format with canonical names and recalculate colors based on sorted order
    const sorted = [...groupMap.entries()]
      .map(([, data]) => ({
        name: getCanonicalName([...data.originalNames]),
        value: data.value,
        fill: data.fill
      }))
      .filter(d => d.value > 0)
      .sort((a, b) => a.name.localeCompare(b.name))
    
    // Reassign colors based on sorted order to ensure consistent palette usage
    return sorted.map((slice, index) => ({
      ...slice,
      fill: palette[index % palette.length]
    }))
  }, [rangeTasks, palette, endStrEffective])

  const aggregateDaily = useCallback((tasks: TimetableTask[]) => {
    const map = new Map<string, number>()
    for (const t of tasks) {
      // Filter out secondary tasks that shouldn't be counted in stats
      if (t.is_secondary && !t.count_in_stats) continue
      const dateKey = t.instance_date || t.start_date
      if (!dateKey) continue
      const h = parseHours(t.start_time, t.end_time)
      map.set(dateKey, (map.get(dateKey) || 0) + h)
    }
    const totals = [...map.entries()].sort((a,b)=>a[0].localeCompare(b[0]))
    const totalHours = totals.reduce((s, [,h]) => s + h, 0)
    const highest = totals.reduce((m, [,h]) => Math.max(m, h), 0)
    return { totals, totalHours, highest }
  }, [])

  const allAgg = useMemo(() => aggregateDaily(allTasks), [allTasks, aggregateDaily])
  const allDaysCount = useMemo(() => {
    if (allAgg.totals.length === 0) return 0
    const first = allAgg.totals[0][0]
    const last = allAgg.totals[allAgg.totals.length-1][0]
    const d1 = new Date(first)
    const d2 = new Date(last)
    const diff = Math.floor((d2.getTime()-d1.getTime())/86400000) + 1
    return Math.max(diff, 1)
  }, [allAgg])
  const allAvgPerDay = allDaysCount ? allAgg.totalHours / allDaysCount : 0

  const selectedAgg = useMemo(() => {
    const filtered = rangeTasks.filter((t: TimetableTask) => {
      const d = t.instance_date || t.start_date
      if (!d) return false
      return d >= startStr && d <= endStrEffective
    })
    return aggregateDaily(filtered)
  }, [rangeTasks, startStr, endStrEffective, aggregateDaily])
  const selectedDaysCount = useMemo(() => {
    if (!startStr || !endStrEffective) return 0
    const d1 = new Date(startStr)
    const d2 = new Date(endStrEffective)
    const diff = Math.floor((d2.getTime()-d1.getTime())/86400000) + 1
    return Math.max(diff, 1)
  }, [startStr, endStrEffective])
  const selectedAvgPerDay = selectedDaysCount ? selectedAgg.totalHours / selectedDaysCount : 0

  return {
    period, setPeriod,
    viewMode, setViewMode,
    customStart, setCustomStart,
    customEnd, setCustomEnd,
    label,
    isDark,
    barData,
    pieData,
    allAgg,
    allAvgPerDay,
    selectedAgg,
    selectedAvgPerDay,
    rangeTasks, // Export tasks for hourly heatmap
    startStr, // Export start date for filtering
    endStrEffective, // Export end date for filtering
  }
}



