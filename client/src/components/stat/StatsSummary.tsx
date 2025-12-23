'use client'

interface Props {
  allTotal: number
  allAvgPerDay: number
  allMax: number
  selTotal: number
  selAvgPerDay: number
  selMax: number
  firstTaskDate?: string
  scheduledTaskCount?: number
}

export function StatsSummary({ allTotal, allAvgPerDay, allMax, selTotal, selAvgPerDay, selMax, firstTaskDate, scheduledTaskCount }: Props) {
  // Calculate days since first task
  const daysSinceStart = (() => {
    if (!firstTaskDate) return null
    try {
      const startDate = new Date(firstTaskDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      startDate.setHours(0, 0, 0, 0)
      const diffTime = today.getTime() - startDate.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      return Math.max(0, diffDays)
    } catch {
      return null
    }
  })()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="border rounded p-2">
        <div className="font-semibold mb-1 text-sm">All data</div>
        <div className="text-xs">Total work time: {allTotal.toFixed(1)} h</div>
        <div className="text-xs">Time work each day: {allAvgPerDay.toFixed(1)} h/day</div>
        <div className="text-xs">Highest working time: {allMax.toFixed(1)} h</div>
        {daysSinceStart !== null && (
          <div className="text-xs">Days recording: {daysSinceStart} days</div>
        )}
        {scheduledTaskCount !== undefined && (
          <div className="text-xs">Scheduled tasks: {scheduledTaskCount}</div>
        )}
      </div>
      <div className="border rounded p-2">
        <div className="font-semibold mb-1 text-sm">Selected range</div>
        <div className="text-xs">Work time: {selTotal.toFixed(1)} h</div>
        <div className="text-xs">Time work each day: {selAvgPerDay.toFixed(1)} h/day</div>
        <div className="text-xs">Highest working time: {selMax.toFixed(1)} h</div>
      </div>
    </div>
  )
}



