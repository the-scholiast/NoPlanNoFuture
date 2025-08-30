'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import SharedTimeTable from '@/components/calendar/SharedTimeTable'

function SharedCalendarContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const shareToken = params.shareToken as string
  const [selectedDate, setSelectedDate] = useState(new Date())

  useEffect(() => {
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    const day = searchParams.get('day')

    if (year && month && day) {
      const urlDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      setSelectedDate(urlDate)
    } else if (year && month) {
      const urlDate = new Date(parseInt(year), parseInt(month) - 1, 1)
      setSelectedDate(urlDate)
    }
  }, [searchParams])

  return (
    <>
      <SharedTimeTable selectedDate={selectedDate} shareToken={shareToken} />
    </>
  )
}

function SharedCalendarLoading() {
  return (
    <div className="flex items-center justify-center p-4">
      <div>Loading shared calendar...</div>
    </div>
  )
}

export default function SharedCalendarPage() {
  return (
    <Suspense fallback={<SharedCalendarLoading />}>
      <SharedCalendarContent />
    </Suspense>
  )
}