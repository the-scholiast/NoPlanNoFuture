'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import TimeTable from '@/components/calendar/timetable/TimeTable'
import { useCalendarLastVisited } from '../hooks/useCalendarLastVisited'

function WeekContent() {
  useCalendarLastVisited()
  const searchParams = useSearchParams()
  const [selectedDate, setSelectedDate] = useState(new Date())

  useEffect(() => {
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    const day = searchParams.get('day') // Add day parameter

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
      <TimeTable selectedDate={selectedDate} />
    </>
  )
}

function WeekLoading() {
  return (
    <div className="flex items-center justify-center p-4">
      <div>Loading week view...</div>
    </div>
  )
}

export default function WeekPage() {
  return (
    <Suspense fallback={<WeekLoading />}>
      <WeekContent />
    </Suspense>
  )
}