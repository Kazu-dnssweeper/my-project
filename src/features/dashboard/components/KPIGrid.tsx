'use client'

import { Package, Boxes, AlertTriangle, ArrowLeftRight } from 'lucide-react'
import { KPICard } from './KPICard'
import { useDashboardKPI } from '../hooks/useDashboardKPI'

export function KPIGrid() {
  const { data: kpi, isLoading } = useDashboardKPI()

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="総部品数"
        value={kpi?.totalItems ?? 0}
        unit="件"
        icon={Package}
        isLoading={isLoading}
      />
      <KPICard
        title="在庫総数"
        value={kpi?.totalStock ?? 0}
        unit="個"
        icon={Boxes}
        isLoading={isLoading}
      />
      <KPICard
        title="発注点以下"
        value={kpi?.lowStockCount ?? 0}
        unit="件"
        icon={AlertTriangle}
        variant={
          (kpi?.lowStockCount ?? 0) > 0
            ? (kpi?.lowStockCount ?? 0) > 5
              ? 'danger'
              : 'warning'
            : 'default'
        }
        isLoading={isLoading}
      />
      <KPICard
        title="本日の入出庫"
        value={kpi?.todayTransactions ?? 0}
        unit="件"
        icon={ArrowLeftRight}
        isLoading={isLoading}
      />
    </div>
  )
}
