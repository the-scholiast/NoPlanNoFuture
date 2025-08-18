'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import YearView from '@/components/calendar/yearView'
import { useCalendarLastVisited } from '../hooks/useCalendarLastVisited'

export default function YearPage() {
    useCalendarLastVisited();
    const searchParams = useSearchParams()
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
        } else if (year) {
            // For year view, use January 1st if only year is provided
            const urlDate = new Date(parseInt(year), 0, 1)
            setSelectedDate(urlDate)
        }
    }, [searchParams])

    return (
        <>
            <YearView selectedDate={selectedDate} />
        </>
    )
}