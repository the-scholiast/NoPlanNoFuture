'use client'

import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import type { PieSlice } from './useStatsData'

const RADIAN = Math.PI / 180

interface PieLabelProps {
  cx: number
  cy: number
  midAngle: number
  outerRadius: number
  percent: number
  name: string
  index: number
}

function renderPieLabel(props: PieLabelProps) {
  const { cx, cy, midAngle, outerRadius, percent, name, index } = props
  
  // Hide label if less than 1%
  if (percent < 0.01) return null
  
  // Calculate base position further out
  const radius = outerRadius + 100
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  
  // Adjust vertical position based on index to stagger labels
  const verticalOffset = index % 2 === 0 ? 0 : 20
  const adjustedY = y + verticalOffset
  
  return (
    <text 
      x={x} 
      y={adjustedY} 
      fill="#666" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize="12px"
    >
      {name} {(percent * 100).toFixed(1)}%
    </text>
  )
}

interface Props {
  data: PieSlice[]
}

export function SpendPie({ data }: Props) {
  return (
    <div className="overflow-x-auto flex justify-center">
      <div className="w-[1400px]">
        <ChartContainer config={{}} className="h-[700px] w-[1400px] mx-auto">
          <ResponsiveContainer>
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Pie 
                data={data} 
                dataKey="value" 
                nameKey="name" 
                outerRadius={180} 
                strokeWidth={1} 
                label={renderPieLabel} 
                labelLine
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartLegend content={<ChartLegendContent />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  )
}



