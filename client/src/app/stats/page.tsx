'use client'

import { PeriodAndViewSelector } from '@/components/stat/PeriodAndViewSelector'
import { SpendPie } from '@/components/stat/SpendPie'
import { TimeSpentChart } from '@/components/stat/TimeSpentChart'
import { StatsSummary } from '@/components/stat/StatsSummary'
import { useStatsData } from '@/components/stat/useStatsData'

export default function Page() {
  const s = useStatsData()
  return (
    <div className="p-4 space-y-4">
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

      <h3 className="text-lg font-semibold">Time spent</h3>
      <TimeSpentChart data={s.barData} isDark={s.isDark} />

      <h3 className="text-lg font-semibold">What we spend on</h3>
      <SpendPie data={s.pieData} />

      <StatsSummary
        allTotal={s.allAgg.totalHours}
        allAvgPerDay={s.allAvgPerDay}
        allMax={s.allAgg.highest}
        selTotal={s.selectedAgg.totalHours}
        selAvgPerDay={s.selectedAvgPerDay}
        selMax={s.selectedAgg.highest}
      />
    </div>
  )
}