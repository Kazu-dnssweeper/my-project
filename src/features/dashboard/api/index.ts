import { createClient } from '@/lib/supabase/client'
import type { DashboardKPI, StockAlert, RecentTransaction } from '../types'
import type { Item } from '@/types'

const supabase = createClient()

export async function getDashboardKPI(): Promise<DashboardKPI> {
  // 総部品数
  const { count: totalItems } = await supabase
    .from('items')
    .select('*', { count: 'exact', head: true })

  // 在庫総数
  const { data: stockData } = await supabase
    .from('inventory')
    .select('quantity')

  const totalStock = stockData?.reduce((sum, inv) => sum + (inv.quantity || 0), 0) || 0

  // 発注点以下の部品数を取得
  // まず部品ごとの在庫合計と発注点を取得
  const { data: itemsWithStock } = await supabase
    .from('items')
    .select(`
      id,
      reorder_point,
      inventory(quantity)
    `)
    .not('reorder_point', 'is', null)

  const lowStockCount = itemsWithStock?.filter((item) => {
    const totalQty = item.inventory?.reduce((sum: number, inv: { quantity: number }) => sum + inv.quantity, 0) || 0
    return totalQty <= (item.reorder_point || 0)
  }).length || 0

  // 今日の入出庫数
  const today = new Date().toISOString().split('T')[0]
  const { count: todayTransactions } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .gte('transacted_at', `${today}T00:00:00`)
    .lt('transacted_at', `${today}T23:59:59`)

  return {
    totalItems: totalItems || 0,
    totalStock,
    lowStockCount,
    todayTransactions: todayTransactions || 0,
  }
}

export async function getStockAlerts(limit = 10): Promise<StockAlert[]> {
  const { data: itemsWithStock, error } = await supabase
    .from('items')
    .select(`
      *,
      inventory(quantity)
    `)
    .not('reorder_point', 'is', null)

  if (error || !itemsWithStock) {
    return []
  }

  const alerts: StockAlert[] = []

  for (const item of itemsWithStock) {
    const currentStock = item.inventory?.reduce((sum: number, inv: { quantity: number }) => sum + inv.quantity, 0) || 0
    const reorderPoint = item.reorder_point || 0
    const safetyStock = item.safety_stock || 0

    if (currentStock <= safetyStock) {
      alerts.push({
        item: item as unknown as Item,
        currentStock,
        reorderPoint,
        safetyStock,
        severity: 'critical',
      })
    } else if (currentStock <= reorderPoint) {
      alerts.push({
        item: item as unknown as Item,
        currentStock,
        reorderPoint,
        safetyStock,
        severity: 'warning',
      })
    }
  }

  // severity順（critical優先）、在庫数少ない順でソート
  return alerts
    .sort((a, b) => {
      if (a.severity !== b.severity) {
        return a.severity === 'critical' ? -1 : 1
      }
      return a.currentStock - b.currentStock
    })
    .slice(0, limit)
}

export async function getRecentTransactions(limit = 5): Promise<RecentTransaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      inventory:inventory_id(
        item:item_id(
          name,
          item_code
        )
      )
    `)
    .order('transacted_at', { ascending: false })
    .limit(limit)

  if (error || !data) {
    return []
  }

  return data.map((tx) => ({
    ...tx,
    item_name: tx.inventory?.item?.name || '',
    item_code: tx.inventory?.item?.item_code || '',
  })) as RecentTransaction[]
}
