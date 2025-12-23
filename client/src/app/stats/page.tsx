'use client'

import { PeriodAndViewSelector } from '@/components/stat/PeriodAndViewSelector'
import { SpendPie } from '@/components/stat/SpendPie'
import { TimeSpentChart } from '@/components/stat/TimeSpentChart'
import { StatsSummary } from '@/components/stat/StatsSummary'
import { HourlyHeatmap } from '@/components/stat/HourlyHeatmap'
import { useStatsData } from '@/components/stat/useStatsData'

export default function Page() {
  const s = useStatsData()
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-3 space-y-3 overflow-auto flex-1 min-h-0">
        <PeriodAndViewSelector
          period={s.period}
          setPeriod={s.setPeriod}
          viewMode={s.viewMode}
          setViewMode={s.setViewMode}
          label={s.label}
          customStart={s.customStart}
          setCustomStart={s.setCustomStart}
          customEnd={s.customEnd}
          setCustomEnd={s.setCustomEnd}
        />

        <h3 className="text-base font-semibold">Time spent</h3>
        <TimeSpentChart data={s.barData} isDark={s.isDark} />

        <h3 className="text-base font-semibold">What we spend on</h3>
        <SpendPie data={s.pieData} />

        <h3 className="text-base font-semibold">Hourly work distribution</h3>
        <HourlyHeatmap tasks={s.rangeTasks} isDark={s.isDark} startDate={s.startStr} endDate={s.endStrEffective} />

        <StatsSummary
          allTotal={s.allAgg.totalHours}
          allAvgPerDay={s.allAvgPerDay}
          allMax={s.allAgg.highest}
          selTotal={s.selectedAgg.totalHours}
          selAvgPerDay={s.selectedAvgPerDay}
          selMax={s.selectedAgg.highest}
          firstTaskDate={s.firstTaskDateStr}
          scheduledTaskCount={s.scheduledTaskCount}
        />
      </div>
    </div>
  )
}