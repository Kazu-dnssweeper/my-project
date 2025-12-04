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
