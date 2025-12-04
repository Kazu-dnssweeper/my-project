import { PageHeader } from '@/components/layouts/PageHeader'
import { LotTable, LotExpiryAlert } from '@/features/lot'

export default function LotsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="ロット管理"
        description="ロット単位での在庫管理"
      />
      <LotExpiryAlert limit={5} />
      <LotTable />
    </div>
  )
}
