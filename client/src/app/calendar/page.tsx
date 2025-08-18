'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Display the last visited Calendar page by the user. Default Week page.
export default function Page() {
  const router = useRouter()

  useEffect(() => {
    // Get last visited calendar page from localStorage
    const lastVisitedPage = localStorage.getItem('calendar-last-visited-page')
    const lastVisitedParams = localStorage.getItem('calendar-last-visited-params')
    
    // Default to week view if no preference found
    const defaultPage = '/calendar/week'
    const currentDate = new Date()
    const defaultParams = `?year=${currentDate.getFullYear()}&month=${currentDate.getMonth() + 1}&day=${currentDate.getDate()}`
    
    if (lastVisitedPage && lastVisitedParams) {
      // Redirect to last visited page with its parameters
      router.replace(lastVisitedPage + lastVisitedParams)
    } else {
      // Redirect to default week view with current date
      router.replace(defaultPage + defaultParams)
    }
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-muted-foreground">Redirecting to calendar...</div>
    </div>
  )
}