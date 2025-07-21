'use client'

import { Card } from "../ui/card"
import { Table, TableHeader, TableHead, TableRow, TableBody, TableCell } from "../ui/table"
import { useEffect, useRef } from "react"

export default function TimeTable() {
  const cardRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  // Generate time slots in 30-minute increments for 24 hours
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      // Add the hour slot (e.g., 12:00 AM, 1:00 AM, 12:00 PM, 1:00 PM)
      const hourTime = hour === 0 ? "12:00 AM" :
        hour < 12 ? `${hour}:00 AM` :
          hour === 12 ? "12:00 PM" :
            `${hour - 12}:00 PM`;
      slots.push(hourTime);

      // Add the 30-minute slot (e.g., 12:30 AM, 1:30 AM, 12:30 PM, 1:30 PM) - but not for the last hour
      if (hour < 24) {
        const halfHourTime = hour === 0 ? "12:30 AM" :
          hour < 12 ? `${hour}:30 AM` :
            hour === 12 ? "12:30 PM" :
              `${hour - 12}:30 PM`;
        slots.push(halfHourTime);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const scrollTo7AM = () => {
    const sevenAmRow = document.getElementById('seven-am-row');
    if (!sevenAmRow) return;

    const card = cardRef.current;
    const table = tableRef.current;

    // Try scrolling the card first
    if (card) {
      const headerHeight = table?.querySelector('thead')?.offsetHeight || 0;
      const rowTop = sevenAmRow.offsetTop;
      const scrollPosition = rowTop - headerHeight;

      // Use both methods - one of them should work
      card.scrollTop = scrollPosition;
      card.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      });
    }

    // Also try the table wrapper (the Table component creates a wrapper div)
    const tableWrapper = table?.parentElement;
    if (tableWrapper && tableWrapper !== card) {
      const headerHeight = table?.querySelector('thead')?.offsetHeight || 0;
      const rowTop = sevenAmRow.offsetTop;
      const scrollPosition = rowTop - headerHeight;

      tableWrapper.scrollTop = scrollPosition;
      tableWrapper.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      });
    }
  };

  // Scroll to 7 AM after component mounts
  useEffect(() => {
    const timer = setTimeout(scrollTo7AM, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full h-[calc(100vh-2rem)] flex flex-col">
      <button
        onClick={scrollTo7AM}
        className="mb-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        Scroll to 7 AM
      </button>
      <Card ref={cardRef} className="flex-1 overflow-auto relative">
        <Table ref={tableRef}>
          <TableHeader className="sticky top-0 bg-white z-10">
            <TableRow>
              <TableHead className="w-24 border-r bg-white">Time</TableHead>
              {days.map((day) => (
                <TableHead key={day} className="text-center w-32 bg-white">{day}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {timeSlots.map((time, index) => (
              <TableRow key={time} id={time === "7:00 AM" ? "seven-am-row" : undefined}>
                <TableCell className="font-medium text-sm border-r sticky left-0 bg-white">{time}</TableCell>
                {days.map((day) => (
                  <TableCell key={`${day}-${time}`} className="h-12 border-r w-32 hover:bg-gray-50">
                    {/* Event content will go here */}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}