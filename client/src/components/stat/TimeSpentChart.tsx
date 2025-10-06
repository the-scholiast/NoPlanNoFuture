'use client'

import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Bar, ComposedChart, Line, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import type { BarPoint } from './useStatsData'

interface Props {
  data: BarPoint[]
  isDark: boolean
}

export function TimeSpentChart({ data, isDark }: Props) {
  return (
    <div className="overflow-x-auto flex justify-center">
      <div className="w-[1400px]">
        <ChartContainer config={{ hours: { label: 'Hours', color: isDark ? '#a3e635' : '#166534' } }} className="h-[480px] w-[1300px] mx-auto">
          <ResponsiveContainer>
            <ComposedChart data={data}>
              <XAxis dataKey="date" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="hours" fill="var(--color-hours)" radius={[4,4,0,0]} />
              <Line type="linear" dataKey="hours" stroke={isDark ? '#60a5fa' : '#1d4ed8'} strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  )
}



