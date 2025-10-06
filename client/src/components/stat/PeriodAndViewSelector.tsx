'use client'

import type { Period, ViewMode } from './useStatsData'

interface Props {
  period: Period
  setPeriod: (p: Period) => void
  viewMode: ViewMode
  setViewMode: (v: ViewMode) => void
  label: string
  customStart: string
  setCustomStart: (v: string) => void
  customEnd: string
  setCustomEnd: (v: string) => void
}

export function PeriodAndViewSelector({ period, setPeriod, viewMode, setViewMode, label, customStart, setCustomStart, customEnd, setCustomEnd }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="font-medium">Period:</span>
      <button className={`px-2 py-1 rounded border ${period==='all'?'bg-accent':''}`} onClick={() => setPeriod('all')}>All</button>
      <button className={`px-2 py-1 rounded border ${period==='year'?'bg-accent':''}`} onClick={() => setPeriod('year')}>This Year</button>
      <button className={`px-2 py-1 rounded border ${period==='month'?'bg-accent':''}`} onClick={() => setPeriod('month')}>This Month</button>
      <button className={`px-2 py-1 rounded border ${period==='week'?'bg-accent':''}`} onClick={() => setPeriod('week')}>This Week</button>
      <span className="ml-2 text-muted-foreground">{label}</span>

      <div className="flex items-center gap-2">
        <span className="font-medium">View:</span>
        <button className={`px-2 py-1 rounded border ${viewMode==='day'?'bg-accent':''}`} onClick={() => setViewMode('day')}>Each Day</button>
        <button className={`px-2 py-1 rounded border ${viewMode==='week'?'bg-accent':''}`} onClick={() => setViewMode('week')}>Each Week</button>
        <button className={`px-2 py-1 rounded border ${viewMode==='month'?'bg-accent':''}`} onClick={() => setViewMode('month')}>Each Month</button>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <span className="font-medium">Custom:</span>
        <input type="date" className="px-2 py-1 border rounded" value={customStart} onChange={e => setCustomStart(e.target.value)} />
        <span>to</span>
        <input type="date" className="px-2 py-1 border rounded" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
        <button className="px-2 py-1 border rounded">Apply</button>
        <button className="px-2 py-1 border rounded" onClick={() => { setCustomStart(''); setCustomEnd(''); }}>Reset</button>
      </div>
    </div>
  )
}

export default PeriodAndViewSelector