'use client'

import { useState } from 'react'
import TimeTable from '@/components/calendar/TimeTable'
import DateNavigation from "@/components/calendar/UniversalDateNavigation"

export default function WeekPage() {
  const [selectedDate, setSelectedDate] = useState(new Date())

  const handleDateChange = (date: Date) => {
    setSelectedDate(date)
  }

  return (
    <>
      <TimeTable selectedDate={selectedDate} />
    </>
  )
}