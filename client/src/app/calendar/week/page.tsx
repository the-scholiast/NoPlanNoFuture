'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import TimeTable from '@/components/calendar/TimeTable'

export default function WeekPage() {
  const searchParams = useSearchParams()
  const [selectedDate, setSelectedDate] = useState(new Date())

  useEffect(() => {
    const year = searchParams.get('year')
    const month = searchParams.get('month')

    if (year && month) {
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