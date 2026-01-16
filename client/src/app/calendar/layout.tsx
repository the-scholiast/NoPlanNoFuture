'use client'

export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-full flex flex-col">
      {children}
    </div>
  )
}