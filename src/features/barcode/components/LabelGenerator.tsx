'use client'

import * as React from 'react'
import { jsPDF } from 'jspdf'
import JsBarcode from 'jsbarcode'
import QRCode from 'qrcode'
import { Download, Printer, Barcode, QrCode } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LabelPreview } from './LabelPreview'
import type { LabelConfig, LabelData, LabelSize, LABEL_SIZES } from '../types'

interface LabelGeneratorProps {
  initialData?: Partial<LabelData>
  onClose?: () => void
}

const LABEL_SIZES_CONFIG: Record<LabelSize, { width: number; height: number; name: string }> = {
  small: { width: 50, height: 25, name: '小 (50×25mm)' },
  medium: { width: 70, height: 35, name: '中 (70×35mm)' },
  large: { width: 100, height: 50, name: '大 (100×50mm)' },
}

export function LabelGenerator({ initialData, onClose }: LabelGeneratorProps) {
  const [data, setData] = React.useState<LabelData>({
    itemCode: initialData?.itemCode ?? '',
    itemName: initialData?.itemName ?? '',
    location: initialData?.location ?? '',
  })

  const [config, setConfig] = React.useState<LabelConfig>({
    size: 'medium',
    showItemCode: true,
    showItemName: true,
    showLocation: false,
    barcodeType: 'barcode',
  })

  const [copies, setCopies] = React.useState(1)
  const [isGenerating, setIsGenerating] = React.useState(false)

  const handleConfigChange = <K extends keyof LabelConfig>(
    key: K,
    value: LabelConfig[K]
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  const generatePdf = async () => {
    if (!data.itemCode) return

    setIsGenerating(true)

    try {
      const sizeConfig = LABEL_SIZES_CONFIG[config.size]
      const pdf = new jsPDF({
        orientation: sizeConfig.width > sizeConfig.height ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [sizeConfig.width, sizeConfig.height],
      })

      for (let i = 0; i < copies; i++) {
        if (i > 0) {
          pdf.addPage([sizeConfig.width, sizeConfig.height])
        }

        // Generate barcode/QR code image
        let codeDataUrl: string

        if (config.barcodeType === 'barcode') {
          // Create a canvas for barcode
          const canvas = document.createElement('canvas')
          JsBarcode(canvas, data.itemCode, {
            format: 'CODE128',
            width: 2,
            height: config.size === 'small' ? 15 : config.size === 'medium' ? 20 : 25,
            displayValue: false,
            margin: 0,
          })
          codeDataUrl = canvas.toDataURL('image/png')
        } else {
          // Generate QR code
          const qrSize = config.size === 'small' ? 15 : config.size === 'medium' ? 20 : 25
          codeDataUrl = await QRCode.toDataURL(data.itemCode, {
            width: qrSize * 4,
            margin: 0,
            errorCorrectionLevel: 'M',
          })
        }

        // Calculate positions
        const margin = 2
        const codeWidth = config.barcodeType === 'barcode'
          ? sizeConfig.width - margin * 2
          : (config.size === 'small' ? 15 : config.size === 'medium' ? 20 : 25)
        const codeHeight = config.size === 'small' ? 12 : config.size === 'medium' ? 16 : 20
        const codeX = config.barcodeType === 'barcode'
          ? margin
          : (sizeConfig.width - codeWidth) / 2
        const codeY = margin

        // Add barcode/QR code image
        pdf.addImage(codeDataUrl, 'PNG', codeX, codeY, codeWidth, codeHeight)

        // Add text
        let textY = codeY + codeHeight + 2
        const fontSize = config.size === 'small' ? 6 : config.size === 'medium' ? 8 : 10

        if (config.showItemCode) {
          pdf.setFontSize(fontSize + 1)
          pdf.setFont('helvetica', 'bold')
          pdf.text(data.itemCode, sizeConfig.width / 2, textY, { align: 'center' })
          textY += fontSize * 0.4
        }

        if (config.showItemName) {
          pdf.setFontSize(fontSize)
          pdf.setFont('helvetica', 'normal')
          const truncatedName = data.itemName.length > 20
            ? data.itemName.substring(0, 20) + '...'
            : data.itemName
          pdf.text(truncatedName, sizeConfig.width / 2, textY, { align: 'center' })
          textY += fontSize * 0.4
        }

        if (config.showLocation && data.location) {
          pdf.setFontSize(fontSize - 1)
          pdf.setTextColor(100, 100, 100)
          pdf.text(data.location, sizeConfig.width / 2, textY, { align: 'center' })
          pdf.setTextColor(0, 0, 0)
        }
      }

      // Save PDF
      pdf.save(`label_${data.itemCode}.pdf`)
    } catch (error) {
      console.error('Failed to generate PDF:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePrint = async () => {
    await generatePdf()
    // Note: Actual printing would require the user to print from the PDF viewer
  }

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">ラベル設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Item Code */}
          <div className="space-y-2">
            <Label htmlFor="itemCode">品番 *</Label>
            <Input
              id="itemCode"
              value={data.itemCode}
              onChange={(e) => setData((prev) => ({ ...prev, itemCode: e.target.value }))}
              placeholder="例: ABC-12345"
            />
          </div>

          {/* Item Name */}
          <div className="space-y-2">
            <Label htmlFor="itemName">品名</Label>
            <Input
              id="itemName"
              value={data.itemName}
              onChange={(e) => setData((prev) => ({ ...prev, itemName: e.target.value }))}
              placeholder="例: コネクタ A型"
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">保管場所</Label>
            <Input
              id="location"
              value={data.location}
              onChange={(e) => setData((prev) => ({ ...prev, location: e.target.value }))}
              placeholder="例: A棚-1段"
            />
          </div>

          {/* Label Size */}
          <div className="space-y-2">
            <Label>ラベルサイズ</Label>
            <Select
              value={config.size}
              onValueChange={(value: LabelSize) => handleConfigChange('size', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LABEL_SIZES_CONFIG).map(([key, { name }]) => (
                  <SelectItem key={key} value={key}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Barcode Type */}
          <div className="space-y-2">
            <Label>コードタイプ</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={config.barcodeType === 'barcode' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => handleConfigChange('barcodeType', 'barcode')}
              >
                <Barcode className="h-4 w-4 mr-2" />
                バーコード
              </Button>
              <Button
                type="button"
                variant={config.barcodeType === 'qrcode' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => handleConfigChange('barcodeType', 'qrcode')}
              >
                <QrCode className="h-4 w-4 mr-2" />
                QRコード
              </Button>
            </div>
          </div>

          {/* Display Options */}
          <div className="space-y-3">
            <Label>表示項目</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="showItemCode"
                  checked={config.showItemCode}
                  onCheckedChange={(checked) =>
                    handleConfigChange('showItemCode', checked === true)
                  }
                />
                <Label htmlFor="showItemCode" className="font-normal">
                  品番を表示
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="showItemName"
                  checked={config.showItemName}
                  onCheckedChange={(checked) =>
                    handleConfigChange('showItemName', checked === true)
                  }
                />
                <Label htmlFor="showItemName" className="font-normal">
                  品名を表示
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="showLocation"
                  checked={config.showLocation}
                  onCheckedChange={(checked) =>
                    handleConfigChange('showLocation', checked === true)
                  }
                />
                <Label htmlFor="showLocation" className="font-normal">
                  保管場所を表示
                </Label>
              </div>
            </div>
          </div>

          {/* Copies */}
          <div className="space-y-2">
            <Label htmlFor="copies">印刷枚数</Label>
            <Input
              id="copies"
              type="number"
              min={1}
              max={100}
              value={copies}
              onChange={(e) => setCopies(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">プレビュー</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            {data.itemCode ? (
              <LabelPreview data={data} config={config} />
            ) : (
              <div className="text-muted-foreground text-sm">
                品番を入力するとプレビューが表示されます
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            className="flex-1"
            onClick={generatePdf}
            disabled={!data.itemCode || isGenerating}
          >
            <Download className="h-4 w-4 mr-2" />
            PDF ダウンロード
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={handlePrint}
            disabled={!data.itemCode || isGenerating}
          >
            <Printer className="h-4 w-4 mr-2" />
            印刷
          </Button>
        </div>
      </div>
    </div>
  )
}
