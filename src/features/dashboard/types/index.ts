import type { Item, Transaction } from '@/types'

export interface DashboardKPI {
  totalItems: number       // 総部品数
  totalStock: number       // 在庫総数
  lowStockCount: number    // 発注点以下の部品数
  todayTransactions: number // 今日の入出庫数
}

export interface StockAlert {
  item: Item
  currentStock: number
  reorderPoint: number
  safetyStock: number
  severity: 'warning' | 'critical' // warning: 発注点以下, critical: 安全在庫以下
}

export interface RecentTransaction extends Transaction {
  item_name: string
  item_code: string
}
