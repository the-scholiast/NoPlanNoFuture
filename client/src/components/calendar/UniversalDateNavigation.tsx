/**
 * UniversalDateNavigation Component
 * 
 * A smart date navigation component that automatically determines the navigation mode
 * based on the current route. Can be placed in the root layout to provide
 * consistent navigation across calendar and gym sections.
 * 
 * Route-to-Mode Mapping:
 * - /calendar/year or /gym/year → year mode
 * - /calendar/month or /gym/month → month mode  
 * - /calendar/week → week mode
 * - /gym/workout or any day-specific route → day mode
 * 
 * Features:
 * - Automatic mode detection from pathname
 * - URL parameter synchronization (year, month, day)
 * - Smart navigation with proper URL updates
 * - Conditional rendering (only shows on relevant routes)
 * - Seamless integration with existing breadcrumb patterns
 */

'use client'

import { useState, useEffect } from 'react'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils/tailwindUtils"

type NavigationMode = 'day' | 'week' | 'month' | 'year'

interface UniversalDateNavigationProps {
  /** Optional CSS class name for styling */
  className?: string
}

/**
 * Get the navigation mode based on the current pathname
 */
function getModeFromPath(pathname: string): NavigationMode | null {
  // Don't show navigation on root pages or non-date pages
  if (pathname === '/calendar' || pathname === '/gym' || pathname === '/') {
    return null
  }

  if (pathname.endsWith('/year')) return 'year'
  if (pathname.endsWith('/month')) return 'month'
  if (pathname.endsWith('/week')) return 'week'

  // Day mode routes - different for calendar vs gym
  if (pathname.endsWith('/workout') || pathname.includes('/day') || pathname.endsWith('/planner')) {
    return 'day'
  }

  return null
}

/**
 * Get the base path for navigation (calendar or gym)
 */
function getBasePath(pathname: string): string {
  if (pathname.startsWith('/calendar')) return '/calendar'
  if (pathname.startsWith('/gym')) return '/gym'
  return '/calendar' // fallback
}

/**
 * Format date parameters for URL
 */
function formatDateParams(date: Date) {
  const year = date.getFullYear().toString()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')

  return { year, month, day }
}

/**
 * Create date from URL parameters with fallback to current date
 */
function createDateFromParams(searchParams: URLSearchParams): Date {
  const currentDate = new Date()
  const year = parseInt(searchParams.get('year') || currentDate.getFullYear().toString())
  const month = parseInt(searchParams.get('month') || (currentDate.getMonth() + 1).toString()) - 1
  const day = parseInt(searchParams.get('day') || currentDate.getDate().toString())

  return new Date(year, month, day)
}

export default function UniversalDateNavigation({ className }: UniversalDateNavigationProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [currentDate, setCurrentDate] = useState<Date | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  // Get mode and base path from current route
  const mode = getModeFromPath(pathname)
  const basePath = getBasePath(pathname)

  // Initialize date from URL params or current date
  useEffect(() => {
    const dateFromParams = createDateFromParams(searchParams)
    setCurrentDate(dateFromParams)
    setIsMounted(true)
  }, [searchParams])

  // Don't render if we can't determine the mode
  if (!mode || !isMounted || !currentDate) {
    return null
  }

  /**
   * Navigate to previous period and update URL
   */
  const navigatePrevious = () => {
    if (!currentDate) return

    const newDate = new Date(currentDate)

    switch (mode) {
      case 'day':
        newDate.setDate(currentDate.getDate() - 1)
        break
      case 'week':
        newDate.setDate(currentDate.getDate() - 7)
        break
      case 'month':
        newDate.setMonth(currentDate.getMonth() - 1)
        break
      case 'year':
        newDate.setFullYear(currentDate.getFullYear() - 1)
        break
    }

    updateURL(newDate)
  }

  /**
   * Navigate to next period and update URL
   */
  const navigateNext = () => {
    if (!currentDate) return

    const newDate = new Date(currentDate)

    switch (mode) {
      case 'day':
        newDate.setDate(currentDate.getDate() + 1)
        break
      case 'week':
        newDate.setDate(currentDate.getDate() + 7)
        break
      case 'month':
        newDate.setMonth(currentDate.getMonth() + 1)
        break
      case 'year':
        newDate.setFullYear(currentDate.getFullYear() + 1)
        break
    }

    updateURL(newDate)
  }

  /**
   * Update URL with new date parameters
   */
  const updateURL = (date: Date) => {
    const { year, month, day } = formatDateParams(date)
    const params = new URLSearchParams()

    // Always include year
    params.set('year', year)

    // Include month for month/week/day modes
    if (mode === 'month' || mode === 'week' || mode === 'day') {
      params.set('month', month)
    }

    // Include day for week and day modes (this is the key change!)
    if (mode === 'week' || mode === 'day') {
      params.set('day', day)
    }

    // Navigate to the same page with updated params
    router.push(`${pathname}?${params.toString()}`)
    setCurrentDate(date)
  }

  /**
   * Generate display text based on mode
   */
  const getDisplayText = (): string => {
    if (!currentDate) return 'Loading...'

    switch (mode) {
      case 'day':
        return currentDate.toLocaleDateString('default', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })

      case 'week': {
        // Calculate Monday of current week
        const monday = new Date(currentDate)
        const day = monday.getDay()
        const diff = monday.getDate() - day + (day === 0 ? -6 : 1)
        monday.setDate(diff)

        // Calculate Sunday of current week
        const sunday = new Date(monday)
        sunday.setDate(monday.getDate() + 6)

        // Format based on whether week spans months
        if (monday.getMonth() === sunday.getMonth()) {
          return `${monday.toLocaleString('default', { month: 'long' })} ${monday.getDate()}-${sunday.getDate()}, ${monday.getFullYear()}`
        } else {
          return `${monday.toLocaleString('default', { month: 'long' })} ${monday.getDate()} - ${sunday.toLocaleString('default', { month: 'long' })} ${sunday.getDate()}, ${monday.getFullYear()}`
        }
      }

      case 'month':
        return `${currentDate.toLocaleString('default', { month: 'long' })} ${currentDate.getFullYear()}`

      case 'year':
        return currentDate.getFullYear().toString()

      default:
        return 'Loading...'
    }
  }

  /**
   * Get minimum width based on mode
   */
  const getMinWidth = (): string => {
    switch (mode) {
      case 'day': return 'min-w-[280px]'
      case 'week': return 'min-w-[200px]'
      case 'month': return 'min-w-[150px]'
      case 'year': return 'min-w-[80px]'
      default: return 'min-w-[200px]'
    }
  }

  return (
    <div className={cn("flex items-center justify-center gap-2 mb-6", className)}>
      {/* Previous navigation button */}
      <Button variant="ghost" size="sm" onClick={navigatePrevious}>
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Current date/period display */}
      <span className={cn("font-medium text-center", getMinWidth())}>
        {getDisplayText()}
      </span>

      {/* Next navigation button */}
      <Button variant="ghost" size="sm" onClick={navigateNext}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}