'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '../ui/card';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';

interface YearViewProps {
    selectedDate?: Date;
}

export default function YearView({ selectedDate }: YearViewProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
    const [isMounted, setIsMounted] = useState(false);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    useEffect(() => setIsMounted(true), []);

    // sync from url
    useEffect(() => {
        const year = searchParams.get('year');
        const month = searchParams.get('month');
        const day = searchParams.get('day');

        if (year) {
            const monthParam = month ? parseInt(month) - 1 : 0;
            const dayParam = day ? parseInt(day) : 1;
            setCurrentDate(new Date(parseInt(year), monthParam, dayParam));
        } else if (selectedDate) {
            setCurrentDate(selectedDate);
        }
    }, [searchParams, selectedDate]);

    // build a mini calendar for a month
    const getMiniMonthCalendar = (year: number, month: number) => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const firstDayWeek = firstDay.getDay(); // 0..6 Sun..Sat
        const cells: (Date | null)[] = [];

        for (let i = 0; i < firstDayWeek; i++) cells.push(null);
        for (let d = 1; d <= lastDay.getDate(); d++) cells.push(new Date(year, month, d));
        while (cells.length % 7 !== 0) cells.push(null); // pad to full weeks

        return cells;
    };

    // nav
    const goToPrevYear = () => setCurrentDate(d => new Date(d.getFullYear() - 1, d.getMonth(), d.getDate()));
    const goToNextYear = () => setCurrentDate(d => new Date(d.getFullYear() + 1, d.getMonth(), d.getDate()));
    const goToToday = () => setCurrentDate(new Date());

    const isToday = (date: Date | null) =>
        !!date && date.toDateString() === new Date().toDateString();

    const isSelected = (date: Date | null) =>
        !!date && date.toDateString() === currentDate.toDateString();

    const currentYear = currentDate.getFullYear();

    return (
        <div className="w-full flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-4">
                    <h2 className="text-3xl font-semibold">{isMounted ? currentYear : '--'}</h2>
                    <Button variant="outline" size="sm" onClick={goToToday}>Today</Button>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={goToPrevYear}><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="sm" onClick={goToNextYear}><ChevronRight className="h-4 w-4" /></Button>
                </div>
            </div>

            {/* Grid 12 months */}
            <Card className="flex-1 overflow-auto">
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {Array.from({ length: 12 }, (_, monthIndex) => {
                            const cells = isMounted ? getMiniMonthCalendar(currentYear, monthIndex) : [];
                            const weeks: (Date | null)[][] = [];
                            for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

                            return (
                                <div key={monthIndex} className="border rounded-lg p-3 hover:bg-muted/30 transition-colors">
                                    {/* Month header → click to month view */}
                                    <button
                                        className="w-full text-center font-semibold mb-2 text-sm hover:underline"
                                        onClick={() => router.push(`/calendar/month?year=${currentYear}&month=${monthIndex + 1}`)}
                                    >
                                        {monthNames[monthIndex]}
                                    </button>

                                    {/* Mini calendar */}
                                    <div className="space-y-1">
                                        <div className="grid grid-cols-7 gap-1">
                                            {dayNames.map((d, i) => (
                                                <div key={i } className="text-center text-xs font-medium text-muted-foreground p-1">{d}</div>
                                            ))}
                                        </div>

                                        {weeks.map((week, wi) => (
                                            <div key={wi} className="grid grid-cols-7 gap-1">
                                                {week.map((date, di) => (
                                                    <button
                                                        key={di}
                                                        className={`
                              aspect-square flex items-center justify-center text-xs rounded
                              ${date ? 'cursor-pointer hover:bg-muted/50 transition-colors' : 'opacity-0 cursor-default'}
                              ${isToday(date) ? 'bg-blue-500 text-white font-bold' : ''}
                              ${isSelected(date) ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' : ''}
                            `}
                                                        onClick={() => {
                                                            if (!date) return;
                                                            // click on a day → go to week view
                                                            router.push(`/calendar/week?year=${date.getFullYear()}&month=${date.getMonth() + 1}&day=${date.getDate()}`);
                                                        }}
                                                    >
                                                        {date ? date.getDate() : ''}
                                                    </button>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Card>
        </div>
    );
}
