import { PageHeader } from '@/components/layouts/PageHeader'
import { BarcodeScanButton, ManualEntryFallback } from '@/features/barcode'

export default function ScanPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="バーコードスキャン"
        description="バーコードまたはQRコードをスキャンして部品を検索"
      />
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex justify-center">
          <BarcodeScanButton size="lg" />
        </div>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              または
            </span>
          </div>
        </div>
        <ManualEntryFallback />
      </div>
    </div>
  )
}
