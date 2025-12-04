import type { Item } from '@/types'

export type AlertType = 'low_stock' | 'critical_stock' | 'expiry_warning' | 'expiry_critical'

export type AlertSeverity = 'info' | 'warning' | 'critical'

export interface Alert {
  id: string
  type: AlertType
  severity: AlertSeverity
  title: string
  message: string
  item?: Item
  itemId?: string
  createdAt: string
  isRead: boolean
}

export interface AlertCount {
  total: number
  unread: number
  critical: number
  warning: number
}
