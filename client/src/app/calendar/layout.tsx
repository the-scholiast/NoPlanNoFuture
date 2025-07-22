'use client'

import { usePathname } from 'next/navigation'
import CalendarBreadcrumb from '@/components/calendar/CalendarBreadcrumb'

export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // Don't show breadcrumb on year page
  const shouldShowBreadcrumb = !pathname.endsWith('/year')

  return (
    <div>
      {shouldShowBreadcrumb && <CalendarBreadcrumb />}
      {children}
    </div>
  )
}