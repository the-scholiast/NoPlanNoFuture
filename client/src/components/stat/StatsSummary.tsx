'use client'

interface Props {
  allTotal: number
  allAvgPerDay: number
  allMax: number
  selTotal: number
  selAvgPerDay: number
  selMax: number
}

export function StatsSummary({ allTotal, allAvgPerDay, allMax, selTotal, selAvgPerDay, selMax }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div className="border rounded p-2">
        <div className="font-semibold mb-1 text-sm">All data</div>
        <div className="text-xs">Total work time: {allTotal.toFixed(1)} h</div>
        <div className="text-xs">Time work each day: {allAvgPerDay.toFixed(1)} h/day</div>
        <div className="text-xs">Highest working time: {allMax.toFixed(1)} h</div>
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



