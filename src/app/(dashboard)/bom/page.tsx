import { PageHeader } from '@/components/layouts/PageHeader'
import { BomTable } from '@/features/bom'

export default function BomPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="BOM管理"
        description="部品構成表の管理"
      />
      <BomTable />
    </div>
  )
}
