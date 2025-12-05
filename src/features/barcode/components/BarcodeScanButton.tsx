'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { ScanBarcode } from 'lucide-react'
import { ScanResultDialog } from './ScanResultDialog'
import { findItemByCode } from '../api'
import { logger } from '@/lib/logger'
import type { ScanResult } from '../types'

// 動的インポートでBarcodeScannerを遅延ロード
// @zxing/libraryは大きいライブラリなので、必要時のみロード
const BarcodeScanner = dynamic(
  () => import('./BarcodeScanner').then((mod) => mod.BarcodeScanner),
  {
    loading: () => (
      <div className="flex items-center justify-center h-64 bg-black rounded-lg">
        <div className="text-center text-white">
          <Spinner size="lg" className="mb-2 text-white" />
          <p className="text-sm">スキャナーを読み込み中...</p>
        </div>
      </div>
    ),
    ssr: false,
  }
)

interface BarcodeScanButtonProps {
  onScan?: (result: ScanResult) => void
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showLabel?: boolean
  className?: string
}

export function BarcodeScanButton({
  onScan,
  variant = 'outline',
  size = 'default',
  showLabel = true,
  className,
}: BarcodeScanButtonProps) {
  const [scannerOpen, setScannerOpen] = useState(false)
  const [resultOpen, setResultOpen] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  const handleScan = async (code: string) => {
    setScannerOpen(false)
    setIsSearching(true)

    try {
      const item = await findItemByCode(code)
      const result: ScanResult = {
        code,
        format: 'UNKNOWN',
        item: item || undefined,
        found: !!item,
      }
      setScanResult(result)
      setResultOpen(true)
      onScan?.(result)
    } catch (error) {
      logger.error('Barcode search error', error)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setScannerOpen(true)}
        className={className}
        disabled={isSearching}
      >
        <ScanBarcode className={showLabel ? 'mr-2 h-4 w-4' : 'h-4 w-4'} />
        {showLabel && (isSearching ? '検索中...' : 'スキャン')}
      </Button>

      <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
        <DialogContent className="max-w-sm p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>バーコードスキャン</DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-2">
            <BarcodeScanner
              onScan={handleScan}
              onClose={() => setScannerOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {scanResult && (
        <ScanResultDialog
          result={scanResult}
          open={resultOpen}
          onOpenChange={setResultOpen}
        />
      )}
    </>
  )
}
