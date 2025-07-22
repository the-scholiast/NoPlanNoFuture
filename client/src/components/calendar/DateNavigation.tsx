/**
 * DateNavigation Component
 * 
 * A reusable date navigation component that allows users to navigate between
 * weeks or months using previous/next buttons. Displays the current date range
 * or month in a user-friendly format.
 * 
 * Features:
 * - Week mode: Shows Monday-Sunday date range (e.g., "July 21-27, 2025")
 * - Month mode: Shows full month and year (e.g., "July 2025")
 * - Handles cross-month week spans with appropriate formatting
 * - Prevents hydration issues in Next.js applications
 * - Fully accessible with proper button controls
 * 
 * @example
 * ```tsx
 * // Week navigation
 * <DateNavigation 
 *   mode="week" 
 *   onDateChange={(date) => console.log('New week starting:', date)}
 * />
 * 
 * // Month navigation
 * <DateNavigation 
 *   mode="month" 
 *   onDateChange={(date) => console.log('New month:', date)}
 *   className="my-4"
 * />
 * ```
 */

'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Props for the DateNavigation component
 */
interface DateNavigationProps {
  /** Navigation mode - determines whether to navigate by week or month */
  mode: 'week' | 'month'
  /** Optional callback function called when the date changes */
  onDateChange?: (date: Date) => void
  /** Optional CSS class name for styling */
  className?: string
}

/**
 * DateNavigation Component
 * 
 * Main component function that renders the date navigation interface.
 * Handles state management, date calculations, and user interactions.
 * 
 * @param props - Component props
 * @param props.mode - Navigation mode ('week' or 'month')
 * @param props.onDateChange - Optional callback for date changes
 * @param props.className - Optional CSS class for styling
 * @returns JSX element containing the navigation interface
 */
export default function DateNavigation({
  mode,
  onDateChange,
  className
}: DateNavigationProps) {
  // State to track the current date being displayed
  const [currentDate, setCurrentDate] = useState<Date | null>(null)
  // State to track if component has mounted (prevents hydration issues)
  const [isMounted, setIsMounted] = useState(false)

  // Initialize date on mount to avoid hydration issues between server and client
  useEffect(() => {
    setCurrentDate(new Date()) // Set to today's date
    setIsMounted(true) // Mark component as mounted
  }, [])

  /**
   * Navigate to the previous week or month
   * 
   * Creates a new Date object and subtracts the appropriate time period
   * based on the current mode. Notifies parent component of the change.
   */
  const navigatePrevious = () => {
    if (!currentDate) return

    const newDate = new Date(currentDate) // Create copy to avoid mutation
    if (mode === 'week') {
      // Go back 7 days for week mode
      newDate.setDate(currentDate.getDate() - 7)
    } else {
      // Go back 1 month for month mode
      newDate.setMonth(currentDate.getMonth() - 1)
    }
    setCurrentDate(newDate)
    onDateChange?.(newDate) // Notify parent component of date change
  }

  /**
   * Navigate to the next week or month
   * 
   * Creates a new Date object and adds the appropriate time period
   * based on the current mode. Notifies parent component of the change.
   */
  const navigateNext = () => {
    if (!currentDate) return

    const newDate = new Date(currentDate) // Create copy to avoid mutation
    if (mode === 'week') {
      // Go forward 7 days for week mode
      newDate.setDate(currentDate.getDate() + 7)
    } else {
      // Go forward 1 month for month mode
      newDate.setMonth(currentDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
    onDateChange?.(newDate) // Notify parent component of date change
  }

  /**
   * Generate the display text for the current date/period
   * 
   * Returns formatted text based on the navigation mode:
   * - Week mode: "July 21-27, 2025" or "July 28 - August 3, 2025" (cross-month)
   * - Month mode: "July 2025"
   * 
   * @returns Formatted date string or "Loading..." if not ready
   */
  const getDisplayText = () => {
    if (!currentDate || !isMounted) return 'Loading...'

    if (mode === 'week') {
      // Calculate the Monday of the current week
      const monday = new Date(currentDate)
      const day = monday.getDay() // 0 = Sunday, 1 = Monday, etc.
      // Calculate how many days to subtract to get to Monday
      const diff = monday.getDate() - day + (day === 0 ? -6 : 1)
      monday.setDate(diff)

      // Calculate the Sunday of the current week (6 days after Monday)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)

      // Check if the week spans across different months
      if (monday.getMonth() === sunday.getMonth()) {
        // Same month: "July 21-27, 2025"
        return `${monday.toLocaleString('default', { month: 'long' })} ${monday.getDate()}-${sunday.getDate()}, ${monday.getFullYear()}`
      } else {
        // Different months: "July 28 - August 3, 2025"
        return `${monday.toLocaleString('default', { month: 'long' })} ${monday.getDate()} - ${sunday.toLocaleString('default', { month: 'long' })} ${sunday.getDate()}, ${monday.getFullYear()}`
      }
    } else {
      // Month mode: "July 2025"
      return `${currentDate.toLocaleString('default', { month: 'long' })} ${currentDate.getFullYear()}`
    }
  }

  // Show loading state until component is mounted (prevents hydration mismatch)
  if (!isMounted) {
    return (
      <div className={cn("flex items-center justify-center gap-2", className)}>
        <Button variant="ghost" size="sm" disabled>
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <span className="font-medium min-w-[200px] text-center">
          Loading...
        </span>

        <Button variant="ghost" size="sm" disabled>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  // Render the main navigation component
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      {/* Previous navigation button */}
      <Button variant="ghost" size="sm" onClick={navigatePrevious}>
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Current date/week display */}
      <span className="font-medium min-w-[200px] text-center">
        {getDisplayText()}
      </span>

      {/* Next navigation button */}
      <Button variant="ghost" size="sm" onClick={navigateNext}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}