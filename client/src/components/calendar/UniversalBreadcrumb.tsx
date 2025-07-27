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

/**
 * Get the base path for navigation (calendar or gym)
 */
function getBasePath(pathname: string): string {
  if (pathname.startsWith('/calendar')) return '/calendar'
  if (pathname.startsWith('/gym')) return '/gym'
  return '/calendar' // fallback
}

/**
 * Determine page type from pathname
 */
function getPageType(pathname: string) {
  const isYearPage = pathname.endsWith('/year')
  const isMonthPage = pathname.endsWith('/month')
  const isWeekPage = pathname.endsWith('/week')
  const isDayPage = pathname.endsWith('/planner') || pathname.endsWith('/workout')

  return { isYearPage, isMonthPage, isWeekPage, isDayPage }
}

/**
 * Get the day route suffix based on section
 */
function getDayRoute(basePath: string): string {
  return basePath === '/calendar' ? '/planner' : '/workout'
}

export default function UniversalBreadcrumb() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Get base path and page types
  const basePath = getBasePath(pathname)
  const { isYearPage, isMonthPage, isWeekPage, isDayPage } = getPageType(pathname)

  // Don't show breadcrumb on root section pages only
  if (pathname === basePath) {
    return null
  }

  // Extract date parameters from URL or use current date as fallback
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear().toString()
  const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0')
  const currentDay = currentDate.getDate().toString().padStart(2, '0')

  const year = searchParams.get('year') || currentYear
  const month = searchParams.get('month') || currentMonth
  const day = searchParams.get('day') || currentDay

  // Format date strings
  const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('default', { month: 'long' })
  const dayName = new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString('default', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })

  return (
    <Breadcrumb className="">
      <BreadcrumbList>
        {/* Year link - show as clickable link on month/week/day pages, non-clickable on year pages */}
        <BreadcrumbItem>
          {isYearPage ? (
            // Show as current page when on year page
            <BreadcrumbPage>
              {year}
            </BreadcrumbPage>
          ) : (
            // Show as link when on other pages
            <BreadcrumbLink asChild>
              <Link href={`${basePath}/year?year=${year}`}>
                {year}
              </Link>
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>

        {/* Month section */}
        {(isMonthPage || isWeekPage || isDayPage) && (
          <>
            <BreadcrumbSeparator>
              <SlashIcon />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              {(isWeekPage || isDayPage) ? (
                // Show as link when on week or day pages
                <BreadcrumbLink asChild>
                  <Link href={`${basePath}/month?year=${year}&month=${month}`}>
                    {monthName}
                  </Link>
                </BreadcrumbLink>
              ) : (
                // Show as current page when on month page
                <BreadcrumbPage>
                  {monthName}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </>
        )}

        {/* Week section - only show on week pages */}
        {isWeekPage && (
          <>
            <BreadcrumbSeparator>
              <SlashIcon />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>
                Week
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}

        {/* Day section - only show on day pages (planner/workout) */}
        {isDayPage && (
          <>
            <BreadcrumbSeparator>
              <SlashIcon />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>
                {dayName}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}