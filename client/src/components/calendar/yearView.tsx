'use client'

import { useSearchParams } from 'next/navigation'
import { Card } from "../ui/card"
import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "../ui/button"

interface YearViewProps {
    selectedDate?: Date
}

export default function YearView({ selectedDate }: YearViewProps) {
    const searchParams = useSearchParams();
    const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
    const [isMounted, setIsMounted] = useState(false);

    const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    // Set mounted state after component mounts to avoid hydration issues
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Sync with URL parameters
    useEffect(() => {
        const year = searchParams.get('year')
        const month = searchParams.get('month')
        const day = searchParams.get('day')

        if (year) {
            const monthParam = month ? parseInt(month) - 1 : 0;
            const dayParam = day ? parseInt(day) : 1;
            const urlDate = new Date(parseInt(year), monthParam, dayParam)
            setCurrentDate(urlDate)
        } else if (selectedDate) {
            setCurrentDate(selectedDate)
        }
    }, [searchParams, selectedDate])

    // Get mini calendar for a specific month
    const getMiniMonthCalendar = (year: number, month: number) => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        // Get day of week for first day (0 = Sunday)
        const firstDayWeek = firstDay.getDay();

        const calendar: (Date | null)[] = [];

        // Add empty cells for days before month starts
        for (let i = 0; i < firstDayWeek; i++) {
            calendar.push(null);
        }

        // Add all days of the month
        for (let day = 1; day <= lastDay.getDate(); day++) {
            calendar.push(new Date(year, month, day));
        }

        // Fill remaining cells to complete the grid (6 weeks = 42 cells)
        while (calendar.length < 42) {
            calendar.push(null);
        }

        return calendar;
    };

    // Navigation functions
    const goToPrevYear = () => {
        const prevYear = new Date(currentDate);
        prevYear.setFullYear(currentDate.getFullYear() - 1);
        setCurrentDate(prevYear);
    };

    const goToNextYear = () => {
        const nextYear = new Date(currentDate);
        nextYear.setFullYear(currentDate.getFullYear() + 1);
        setCurrentDate(nextYear);
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // Check if date is today
    const isToday = (date: Date | null) => {
        if (!date) return false;
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    // Check if date is selected
    const isSelected = (date: Date | null) => {
        if (!date) return false;
        return date.toDateString() === currentDate.toDateString();
    };

    const currentYear = currentDate.getFullYear();

    return (
        <div className="w-full flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-4">
                    <h2 className="text-3xl font-semibold">
                        {isMounted ? currentYear : '--'}
                    </h2>
                    <Button variant="outline" size="sm" onClick={goToToday}>
                        Today
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={goToPrevYear}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={goToNextYear}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Year Grid - 4 rows x 3 columns of months */}
            <Card className="flex-1 overflow-auto">
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Array.from({ length: 12 }, (_, monthIndex) => {
                            const calendar = isMounted ? getMiniMonthCalendar(currentYear, monthIndex) : [];
                            const weeks = [];

                            // Split calendar into weeks
                            for (let i = 0; i < calendar.length; i += 7) {
                                weeks.push(calendar.slice(i, i + 7));
                            }

                            return (
                                <div key={monthIndex} className="border rounded-lg p-3 hover:bg-muted/30 transition-colors">
                                    {/* Month header */}
                                    <div className="text-center font-semibold mb-2 text-sm">
                                        {monthNames[monthIndex]}
                                    </div>

                                    {/* Mini calendar */}
                                    <div className="space-y-1">
                                        {/* Day headers */}
                                        <div className="grid grid-cols-7 gap-1">
                                            {dayNames.map((day) => (
                                                <div key={day} className="text-center text-xs font-medium text-muted-foreground p-1">
                                                    {day}
                                                </div>
                                            ))}
                                        </div>

                                        {/* Calendar grid */}
                                        {weeks.map((week, weekIndex) => (
                                            <div key={weekIndex} className="grid grid-cols-7 gap-1">
                                                {week.map((date, dayIndex) => (
                                                    <div
                                                        key={dayIndex}
                                                        className={`
                              aspect-square flex items-center justify-center text-xs rounded cursor-pointer
                              hover:bg-muted/50 transition-colors
                              ${date ? 'text-foreground' : ''}
                              ${isToday(date) ? 'bg-blue-500 text-white font-bold' : ''}
                              ${isSelected(date) ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : ''}
                            `}
                                                        onClick={() => {
                                                            if (date) {
                                                                setCurrentDate(new Date(date));
                                                            }
                                                        }}
                                                    >
                                                        {date ? date.getDate() : ''}
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Event indicators - placeholder */}
                                    <div className="mt-2 space-y-1">
                                        {monthIndex % 3 === 0 && (
                                            <div className="text-xs text-muted-foreground">
                                                • {Math.floor(Math.random() * 5) + 1} events
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Card>
        </div>
    )
}