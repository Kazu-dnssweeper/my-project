'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScanBarcode } from 'lucide-react'
import { BarcodeScanner } from './BarcodeScanner'
import { ScanResultDialog } from './ScanResultDialog'
import { findItemByCode } from '../api'
import type { ScanResult } from '../types'

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
      console.error('Search error:', error)
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
