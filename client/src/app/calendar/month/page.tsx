'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import MonthView from '@/components/calendar/monthView'
import { useCalendarLastVisited } from '../hooks/useCalendarLastVisited'

function MonthContent() {
  useCalendarLastVisited();
  const searchParams = useSearchParams();
  const [selectedDate, setSelectedDate] = useState(new Date())

  useEffect(() => {
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    const day = searchParams.get('day')

    if (year && month && day) {
      // Create date with specific day
      const urlDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      setSelectedDate(urlDate)
    } else if (year && month) {
      // Fallback to first day of month if day is missing
      const urlDate = new Date(parseInt(year), parseInt(month) - 1, 1)
      setSelectedDate(urlDate)
    }
  }, [searchParams])

  return (
    <>
      <MonthView selectedDate={selectedDate} />
    </>
  )
}

function MonthLoading() {
  return (
    <div className="flex items-center justify-center p-4">
      <div>Loading calendar...</div>
    </div>
  )
}

export default function MonthPage() {
  return (
    <Suspense fallback={<MonthLoading />}>
      <MonthContent />
    </Suspense>
  )
}