'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import TimeTable from '@/components/calendar/timetable/TimeTable'

export default function WeekPage() {
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