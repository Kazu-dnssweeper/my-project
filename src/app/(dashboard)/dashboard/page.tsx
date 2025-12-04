import { PageHeader } from '@/components/layouts/PageHeader'
import { KPIGrid, StockAlertList, RecentTransactions } from '@/features/dashboard'
import { AlertBanner } from '@/features/alerts'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <AlertBanner />
      <PageHeader
        title="ダッシュボード"
        description="在庫状況の概要を確認できます"
      />
      <KPIGrid />
      <div className="grid gap-6 lg:grid-cols-2">
        <StockAlertList limit={5} />
        <RecentTransactions limit={5} />
      </div>
    </div>
  )
}
