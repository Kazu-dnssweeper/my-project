import type { Item } from '@/types'

export type BarcodeFormat = 'QR_CODE' | 'CODE_128' | 'EAN_13' | 'CODE_39'

export interface ScanResult {
  code: string
  format: string
  item?: Item
  found: boolean
}

export interface ScanAction {
  type: 'view' | 'in' | 'out' | 'new'
  label: string
}

export type LabelSize = 'small' | 'medium' | 'large'

export interface LabelConfig {
  size: LabelSize
  showItemCode: boolean
  showItemName: boolean
  showLocation: boolean
  barcodeType: 'barcode' | 'qrcode'
}

export interface LabelData {
  itemCode: string
  itemName: string
  location?: string
}

export const LABEL_SIZES: Record<LabelSize, { width: number; height: number; name: string }> = {
  small: { width: 50, height: 25, name: '小 (50×25mm)' },
  medium: { width: 70, height: 35, name: '中 (70×35mm)' },
  large: { width: 100, height: 50, name: '大 (100×50mm)' },
}
