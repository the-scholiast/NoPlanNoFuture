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

export default function GymBreadcrumb() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Extract year, month, and day from URL params or use current date as fallback
  const currentDate = new Date()
  const currentYear = currentDate.getFullYear().toString()
  const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0')
  const currentDay = currentDate.getDate().toString().padStart(2, '0')

  const year = searchParams.get('year') || currentYear
  const month = searchParams.get('month') || currentMonth
  const day = searchParams.get('day') || currentDay

  const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('default', { month: 'long' })
  const dayName = new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toLocaleDateString('default', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  })

  // Determine current page type
  const isYearPage = pathname.endsWith('/year')
  const isMonthPage = pathname.endsWith('/month')
  const isWorkoutPage = pathname.endsWith('/workout')

  // // Don't show breadcrumb on year page (similar to calendar layout)
  // if (isYearPage) {
  //   return null
  // }

  return (
    <Breadcrumb className="mb-10">
      <BreadcrumbList>
        {/* Year link - always show on month and workout pages */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={`/gym/year?year=${year}`}>
              {year}
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {/* Month section - show on workout pages, or as current page on month pages */}
        {(isMonthPage || isWorkoutPage) && (
          <>
            <BreadcrumbSeparator>
              <SlashIcon />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              {isWorkoutPage ? (
                <BreadcrumbLink asChild>
                  <Link href={`/gym/month?year=${year}&month=${month}`}>
                    {monthName}
                  </Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>
                  {monthName}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </>
        )}

        {/* Day section - only show on workout pages */}
        {isWorkoutPage && (
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