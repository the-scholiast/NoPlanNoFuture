'use client'

import { useMemo, useState } from 'react'
import { useTheme } from 'next-themes'
import { useQuery } from '@tanstack/react-query'
import { timetableApi } from '@/lib/api/timetableApi'
import { formatDateString } from '@/lib/utils/dateUtils'

export type Period = 'all' | 'year' | 'month' | 'week'
export type ViewMode = 'day' | 'week' | 'month'

export interface BarPoint { date: string; hours: number }
export interface PieSlice { name: string; value: number; fill: string }

export function useStatsData() {
  const { theme } = useTheme()
  const [period, setPeriod] = useState<Period>('week')
  const [viewMode, setViewMode] = useState<ViewMode>('day')
  const [customStart, setCustomStart] = useState<string>("")
  const [customEnd, setCustomEnd] = useState<string>("")

  const today = new Date()
  const endStrToday = formatDateString(today)
  const yearStartStr = formatDateString(new Date(today.getFullYear(), 0, 1))
  const monthStartStr = formatDateString(new Date(today.getFullYear(), today.getMonth(), 1))
  const weekStartStr = useMemo(() => {
    const d = new Date(today)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return formatDateString(new Date(d.setDate(diff)))
  }, [])
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

  const parseHours = (start?: string, end?: string): number => {
    if (!start || !end) return 0
    const [sh, sm] = start.split(':').map(Number)
    const [eh, em] = end.split(':').map(Number)
    const mins = (eh * 60 + em) - (sh * 60 + sm)
    return Math.max(0, mins) / 60
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
    const map = new Map<string, { name: string; value: number; fill: string }>()
    for (const t of rangeTasks) {
      const title = t.title || 'Untitled'
      const d = t.instance_date || t.start_date
      if (!d || d > endStrEffective) continue
      const h = parseHours(t.start_time, t.end_time)
      const prev = map.get(title)?.value || 0
      const color = t.color || palette[map.size % palette.length]
      map.set(title, { name: title, value: prev + h, fill: color })
    }
    return [...map.values()].filter(d => d.value > 0).sort((a,b)=>a.name.localeCompare(b.name))
  }, [rangeTasks, palette, endStrEffective])

  function aggregateDaily(tasks: any[]) {
    const map = new Map<string, number>()
    for (const t of tasks) {
      const dateKey = t.instance_date || t.start_date
      if (!dateKey) continue
      const h = parseHours(t.start_time, t.end_time)
      map.set(dateKey, (map.get(dateKey) || 0) + h)
    }
    const totals = [...map.entries()].sort((a,b)=>a[0].localeCompare(b[0]))
    const totalHours = totals.reduce((s, [,h]) => s + h, 0)
    const highest = totals.reduce((m, [,h]) => Math.max(m, h), 0)
    return { totals, totalHours, highest }
  }

  const allAgg = useMemo(() => aggregateDaily(allTasks), [allTasks])
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
    const filtered = rangeTasks.filter((t: any) => {
      const d = t.instance_date || t.start_date
      if (!d) return false
      return d >= startStr && d <= endStrEffective
    })
    return aggregateDaily(filtered)
  }, [rangeTasks, startStr, endStrEffective])
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
  }
}



