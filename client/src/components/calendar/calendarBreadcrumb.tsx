'use client'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { SlashIcon } from "lucide-react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

export default function CalendarBreadcrumb() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Extract year and month from URL params or use current date as fallback
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear().toString()
  const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0')

  const year = searchParams.get('year') || currentYear
  const month = searchParams.get('month') || currentMonth
  const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('default', { month: 'long' })

  // Determine current page type
  const isMonthPage = pathname.endsWith('/month')
  const isWeekPage = pathname.endsWith('/week')

  return (
    <Breadcrumb className="mb-10">
      <BreadcrumbList>
        {/* Year link - always show on month and week pages */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={`/calendar/year?year=${year}`}>
              {year}
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {/* Month section - only show on week pages */}
        {isWeekPage && (
          <>
            <BreadcrumbSeparator>
              <SlashIcon />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/calendar/month?year=${year}&month=${month}`}>
                  {monthName}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </>
        )}

        {/* Current page indicator */}
        {(isMonthPage || isWeekPage) && (
          <>
            <BreadcrumbSeparator>
              <SlashIcon />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>
                {isMonthPage ? monthName : 'Week'}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}