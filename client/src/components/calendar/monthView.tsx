'use client'

import { useSearchParams } from 'next/navigation'
import { Card } from "../ui/card"
import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "../ui/button"

interface MonthViewProps {
    selectedDate?: Date
}

export default function MonthView({ selectedDate }: MonthViewProps) {
    const searchParams = useSearchParams();
    const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
    const [isMounted, setIsMounted] = useState(false);

    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    // Set mounted state after component mounts to avoid hydration issues
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Sync with URL parameters
    useEffect(() => {
        const year = searchParams.get('year')
        const month = searchParams.get('month')
        const day = searchParams.get('day')

        if (year && month) {
            const dayParam = day ? parseInt(day) : 1;
            const urlDate = new Date(parseInt(year), parseInt(month) - 1, dayParam)
            setCurrentDate(urlDate)
        } else if (selectedDate) {
            setCurrentDate(selectedDate)
        }
    }, [searchParams, selectedDate])

    // Get calendar grid for the month
    const getMonthCalendar = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();

        // First day of the month
        const firstDay = new Date(year, month, 1);
        // Last day of the month
        const lastDay = new Date(year, month + 1, 0);

        // Get day of week for first day (0 = Sunday, 1 = Monday, etc.)
        // Convert to Monday = 0 format
        const firstDayWeek = (firstDay.getDay() + 6) % 7;

        // Calculate how many days from previous month to show
        const daysFromPrevMonth = firstDayWeek;

        // Calculate start date (may be from previous month)
        const startDate = new Date(firstDay);
        startDate.setDate(firstDay.getDate() - daysFromPrevMonth);

        // Generate 6 weeks (42 days) to ensure consistent grid
        const calendar: Date[] = [];
        const currentDay = new Date(startDate);

        for (let i = 0; i < 42; i++) {
            calendar.push(new Date(currentDay));
            currentDay.setDate(currentDay.getDate() + 1);
        }

        return calendar;
    };

    // Navigation functions
    const goToPrevMonth = () => {
        const prevMonth = new Date(currentDate);
        prevMonth.setMonth(currentDate.getMonth() - 1);
        setCurrentDate(prevMonth);
    };

    const goToNextMonth = () => {
        const nextMonth = new Date(currentDate);
        nextMonth.setMonth(currentDate.getMonth() + 1);
        setCurrentDate(nextMonth);
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // Check if date is today
    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    // Check if date is in current month
    const isCurrentMonth = (date: Date) => {
        return date.getMonth() === currentDate.getMonth() &&
            date.getFullYear() === currentDate.getFullYear();
    };

    // Check if date is selected
    const isSelected = (date: Date) => {
        return date.toDateString() === currentDate.toDateString();
    };

    const calendar = isMounted ? getMonthCalendar(currentDate) : [];

    // Split calendar into weeks
    const weeks = [];
    for (let i = 0; i < calendar.length; i += 7) {
        weeks.push(calendar.slice(i, i + 7));
    }

    return (
        <div className="w-full flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-semibold">
                        {isMounted ? `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}` : '--'}
                    </h2>
                    <Button variant="outline" size="sm" onClick={goToToday}>
                        Today
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={goToPrevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={goToNextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Calendar Grid */}
            <Card className="flex-1 overflow-auto">
                <div className="p-4">
                    {/* Day headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {dayNames.map((dayName) => (
                            <div
                                key={dayName}
                                className="p-2 text-center text-sm font-medium text-muted-foreground border-b"
                            >
                                {dayName}
                            </div>
                        ))}
                    </div>

                    {/* Calendar weeks */}
                    <div className="grid gap-1">
                        {weeks.map((week, weekIndex) => (
                            <div key={weekIndex} className="grid grid-cols-7 gap-1">
                                {week.map((date, dayIndex) => (
                                    <div
                                        key={dayIndex}
                                        className={`
                      min-h-[120px] p-2 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors
                      ${isCurrentMonth(date) ? 'bg-background' : 'bg-muted/20'}
                      ${isToday(date) ? 'ring-2 ring-blue-500' : ''}
                      ${isSelected(date) ? 'bg-blue-50 dark:bg-blue-950/30' : ''}
                    `}
                                        onClick={() => setCurrentDate(new Date(date))}
                                    >
                                        {/* Date number */}
                                        <div className={`
                      text-sm font-medium mb-1
                      ${isCurrentMonth(date) ? 'text-foreground' : 'text-muted-foreground'}
                      ${isToday(date) ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}
                    `}>
                                            {date.getDate()}
                                        </div>

                                        {/* Event area - placeholder for future events */}
                                        <div className="space-y-1">
                                            {/* Example event items */}
                                            {date.getDate() % 7 === 0 && isCurrentMonth(date) && (
                                                <div className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1 py-0.5 rounded truncate">
                                                    Sample Event
                                                </div>
                                            )}
                                            {date.getDate() % 11 === 0 && isCurrentMonth(date) && (
                                                <div className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-1 py-0.5 rounded truncate">
                                                    Meeting
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            </Card>
        </div>
    )
}