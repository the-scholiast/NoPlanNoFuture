'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export function useCalendarLastVisited() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Only track calendar routes, not the root calendar page
    if (pathname.startsWith('/calendar/') && pathname !== '/calendar') {
      const params = searchParams.toString()
      const fullParams = params ? `?${params}` : ''
      
      // Store the current page and its parameters
      localStorage.setItem('calendar-last-visited-page', pathname)
      localStorage.setItem('calendar-last-visited-params', fullParams)
    }
  }, [pathname, searchParams])
}