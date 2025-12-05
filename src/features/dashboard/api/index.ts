import { createClient } from '@/lib/supabase/client'
import type { DashboardKPI, StockAlert, RecentTransaction } from '../types'

const supabase = createClient()

export async function getDashboardKPI(tenantId?: string): Promise<DashboardKPI> {
  // tenantIdが指定されていない場合は現在のユーザーのテナントを取得
  let targetTenantId = tenantId

  if (!targetTenantId) {
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .single()

    targetTenantId = userData?.tenant_id
  }

  if (!targetTenantId) {
    return {
      totalItems: 0,
      totalStock: 0,
      lowStockCount: 0,
      todayTransactions: 0,
    }
  }

  // DB関数を呼び出し
  const { data, error } = await supabase
    .rpc('get_dashboard_kpi', { p_tenant_id: targetTenantId })
    .single()

  if (error || !data) {
    console.error('Failed to get dashboard KPI:', error)
    return {
      totalItems: 0,
      totalStock: 0,
      lowStockCount: 0,
      todayTransactions: 0,
    }
  }

  const kpiData = data as {
    total_items?: number
    total_stock?: number
    low_stock_count?: number
    today_transactions?: number
  }

  return {
    totalItems: kpiData.total_items || 0,
    totalStock: Number(kpiData.total_stock) || 0,
    lowStockCount: kpiData.low_stock_count || 0,
    todayTransactions: kpiData.today_transactions || 0,
  }
}

export async function getStockAlerts(limit = 10, tenantId?: string): Promise<StockAlert[]> {
  // tenantIdが指定されていない場合は現在のユーザーのテナントを取得
  let targetTenantId = tenantId

  if (!targetTenantId) {
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .single()

    targetTenantId = userData?.tenant_id
  }

  if (!targetTenantId) {
    return []
  }

  // DB関数を呼び出し
  const { data, error } = await supabase
    .rpc('get_stock_alerts', { p_tenant_id: targetTenantId, p_limit: limit })

  if (error || !data) {
    console.error('Failed to get stock alerts:', error)
    return []
  }

  return data.map((row: {
    item_id: string
    item_code: string
    item_name: string
    unit: string
    current_stock: number
    reorder_point: number
    safety_stock: number
    severity: 'critical' | 'warning' | 'ok'
  }) => ({
    item: {
      id: row.item_id,
      item_code: row.item_code,
      name: row.item_name,
      unit: row.unit,
    },
    currentStock: Number(row.current_stock),
    reorderPoint: Number(row.reorder_point),
    safetyStock: Number(row.safety_stock),
    severity: row.severity as 'critical' | 'warning',
  }))
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
