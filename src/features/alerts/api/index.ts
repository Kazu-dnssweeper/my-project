import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'
import type { Alert, AlertCount } from '../types'
import type { Item } from '@/types'

export async function getAlerts(): Promise<Alert[]> {
  // 在庫アラートを動的に生成
  const { data: itemsWithStock } = await supabase
    .from('items')
    .select(`
      *,
      inventory(quantity, expiry_date)
    `)
    .or('reorder_point.not.is.null,safety_stock.not.is.null')

  if (!itemsWithStock) {
    return []
  }

  const alerts: Alert[] = []
  const now = new Date()
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  for (const item of itemsWithStock) {
    const inventoryList = item.inventory || []
    const currentStock = inventoryList.reduce((sum: number, inv: { quantity: number }) => sum + inv.quantity, 0)
    const reorderPoint = item.reorder_point || 0
    const safetyStock = item.safety_stock || 0

    // 安全在庫以下（危険）
    if (safetyStock > 0 && currentStock <= safetyStock) {
      alerts.push({
        id: `critical-stock-${item.id}`,
        type: 'critical_stock',
        severity: 'critical',
        title: '在庫が安全在庫以下です',
        message: `${item.name}の在庫が${currentStock}個です（安全在庫: ${safetyStock}）`,
        item: item as unknown as Item,
        itemId: item.id,
        createdAt: now.toISOString(),
        isRead: false,
      })
    }
    // 発注点以下（警告）
    else if (reorderPoint > 0 && currentStock <= reorderPoint) {
      alerts.push({
        id: `low-stock-${item.id}`,
        type: 'low_stock',
        severity: 'warning',
        title: '在庫が発注点以下です',
        message: `${item.name}の在庫が${currentStock}個です（発注点: ${reorderPoint}）`,
        item: item as unknown as Item,
        itemId: item.id,
        createdAt: now.toISOString(),
        isRead: false,
      })
    }

    // 有効期限チェック
    for (const inv of inventoryList) {
      if (inv.expiry_date) {
        const expiryDate = new Date(inv.expiry_date)
        if (expiryDate <= now) {
          alerts.push({
            id: `expiry-critical-${item.id}-${inv.expiry_date}`,
            type: 'expiry_critical',
            severity: 'critical',
            title: '有効期限切れです',
            message: `${item.name}の一部在庫が期限切れです`,
            item: item as unknown as Item,
            itemId: item.id,
            createdAt: now.toISOString(),
            isRead: false,
          })
        } else if (expiryDate <= thirtyDaysFromNow) {
          alerts.push({
            id: `expiry-warning-${item.id}-${inv.expiry_date}`,
            type: 'expiry_warning',
            severity: 'warning',
            title: '有効期限が近づいています',
            message: `${item.name}の一部在庫が30日以内に期限切れになります`,
            item: item as unknown as Item,
            itemId: item.id,
            createdAt: now.toISOString(),
            isRead: false,
          })
        }
      }
    }
  }

  // severity順、日付順でソート
  return alerts.sort((a, b) => {
    const severityOrder = { critical: 0, warning: 1, info: 2 }
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity]
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })
}

export async function getAlertCount(): Promise<AlertCount> {
  const alerts = await getAlerts()

  return {
    total: alerts.length,
    unread: alerts.filter(a => !a.isRead).length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    warning: alerts.filter(a => a.severity === 'warning').length,
  }
}
