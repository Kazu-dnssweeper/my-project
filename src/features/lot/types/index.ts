import type { Inventory, Item, Warehouse, Transaction } from '@/types'

export interface LotWithDetails extends Inventory {
  item: Item
  warehouse: Warehouse
  transactions?: Transaction[]
}

export interface LotSummary {
  lot_number: string
  item: Item
  warehouse: Warehouse
  quantity: number
  received_date: string | null
  expiry_date: string | null
  isExpired: boolean
  isExpiringSoon: boolean  // 30日以内
  daysUntilExpiry: number | null
}

export interface FifoSuggestion {
  lot: LotWithDetails
  suggestedQuantity: number
  reason: string
}
