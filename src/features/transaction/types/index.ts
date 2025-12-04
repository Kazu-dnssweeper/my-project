import type { Transaction, TransactionType, Item, Inventory, Warehouse, PaginationParams } from '@/types'

export type { Transaction, TransactionType }

export interface TransactionWithDetails extends Transaction {
  item_name: string
  item_code: string
  warehouse_name?: string
}

export interface TransactionFilters {
  search?: string
  type?: TransactionType | 'all'
  item_id?: string
  date_from?: string
  date_to?: string
}

export interface TransactionsParams extends PaginationParams {
  filters?: TransactionFilters
}

export type TransactionSubType =
  | 'purchase'      // 仕入
  | 'production'    // 製造
  | 'return_in'     // 返品入庫
  | 'adjustment_in' // 棚卸増
  | 'sales'         // 販売
  | 'consumption'   // 消費
  | 'return_out'    // 返品出庫
  | 'scrap'         // 廃棄
  | 'adjustment_out'// 棚卸減
  | 'transfer'      // 移動

export interface CreateTransactionData {
  item_id: string
  warehouse_id: string
  type: TransactionType
  sub_type?: TransactionSubType
  quantity: number
  lot_number?: string
  note?: string
  to_warehouse_id?: string // MOVEの場合
}

export interface ItemForTransaction {
  id: string
  item_code: string
  name: string
  unit: string
}

export interface InventoryForTransaction extends Inventory {
  item: ItemForTransaction
  warehouse: Warehouse
}
