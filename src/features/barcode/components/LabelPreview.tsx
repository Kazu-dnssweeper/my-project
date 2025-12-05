'use client'

import * as React from 'react'
import JsBarcode from 'jsbarcode'
import QRCode from 'qrcode'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LabelConfig, LabelData, LabelSize, LABEL_SIZES } from '../types'

interface LabelPreviewProps {
  data: LabelData
  config: LabelConfig
  className?: string
}

const SCALE_FACTOR = 3 // mm to px for preview

export function LabelPreview({ data, config, className }: LabelPreviewProps) {
  const barcodeRef = React.useRef<SVGSVGElement>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = React.useState<string>('')

  const sizeConfig = React.useMemo(() => {
    const sizes: Record<LabelSize, { width: number; height: number }> = {
      small: { width: 50, height: 25 },
      medium: { width: 70, height: 35 },
      large: { width: 100, height: 50 },
    }
    return sizes[config.size]
  }, [config.size])

  // Generate barcode
  React.useEffect(() => {
    if (config.barcodeType === 'barcode' && barcodeRef.current && data.itemCode) {
      try {
        JsBarcode(barcodeRef.current, data.itemCode, {
          format: 'CODE128',
          width: 1.5,
          height: config.size === 'small' ? 25 : config.size === 'medium' ? 35 : 45,
          displayValue: false,
          margin: 0,
        })
      } catch (error) {
        console.error('Failed to generate barcode:', error)
      }
    }
  }, [data.itemCode, config.barcodeType, config.size])

  // Generate QR code
  React.useEffect(() => {
    if (config.barcodeType === 'qrcode' && data.itemCode) {
      const qrSize = config.size === 'small' ? 60 : config.size === 'medium' ? 80 : 100
      QRCode.toDataURL(data.itemCode, {
        width: qrSize,
        margin: 0,
        errorCorrectionLevel: 'M',
      })
        .then((url) => setQrCodeDataUrl(url))
        .catch((error) => console.error('Failed to generate QR code:', error))
    }
  }, [data.itemCode, config.barcodeType, config.size])

  return (
    <Card
      className={cn(
        'bg-white border-2 border-dashed flex flex-col items-center justify-center p-2 overflow-hidden',
        className
      )}
      style={{
        width: sizeConfig.width * SCALE_FACTOR,
        height: sizeConfig.height * SCALE_FACTOR,
      }}
    >
      {/* Barcode or QR Code */}
      <div className="flex-1 flex items-center justify-center w-full">
        {config.barcodeType === 'barcode' ? (
          <svg ref={barcodeRef} className="max-w-full" />
        ) : (
          qrCodeDataUrl && (
            <img
              src={qrCodeDataUrl}
              alt="QR Code"
              className="max-w-full max-h-full object-contain"
            />
          )
        )}
      </div>

      {/* Text info */}
      <div className="w-full text-center space-y-0.5 mt-1">
        {config.showItemCode && (
          <p
            className="font-mono font-bold truncate"
            style={{ fontSize: config.size === 'small' ? 8 : config.size === 'medium' ? 10 : 12 }}
          >
            {data.itemCode}
          </p>
        )}
        {config.showItemName && (
          <p
            className="truncate text-gray-700"
            style={{ fontSize: config.size === 'small' ? 7 : config.size === 'medium' ? 9 : 11 }}
          >
            {data.itemName}
          </p>
        )}
        {config.showLocation && data.location && (
          <p
            className="truncate text-gray-500"
            style={{ fontSize: config.size === 'small' ? 6 : config.size === 'medium' ? 8 : 10 }}
          >
            {data.location}
          </p>
        )}
      </div>
    </Card>
  )
}
