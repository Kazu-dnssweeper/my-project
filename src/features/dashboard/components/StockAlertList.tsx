'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle, ExternalLink } from 'lucide-react'
import { useStockAlerts } from '../hooks/useStockAlerts'
import type { StockAlert } from '../types'

interface StockAlertListProps {
  limit?: number
}

export function StockAlertList({ limit = 5 }: StockAlertListProps) {
  const { data: alerts, isLoading } = useStockAlerts(limit)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            在庫アラート
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (!alerts || alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            在庫アラート
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            現在アラートはありません
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          在庫アラート
          <Badge variant="secondary" className="ml-auto">
            {alerts.length}件
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => (
          <AlertItem key={alert.item.id} alert={alert} />
        ))}
        {alerts.length >= limit && (
          <Link
            href="/inventory?filter=low-stock"
            className="flex items-center justify-center gap-1 text-sm text-primary hover:underline pt-2"
          >
            すべて表示
            <ExternalLink className="h-3 w-3" />
          </Link>
        )}
      </CardContent>
    </Card>
  )
}

function AlertItem({ alert }: { alert: StockAlert }) {
  return (
    <Link
      href={`/inventory/${alert.item.id}`}
      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{alert.item.name}</p>
        <p className="text-xs text-muted-foreground">
          {alert.item.item_code} | 現在: {alert.currentStock} / 発注点: {alert.reorderPoint}
        </p>
      </div>
      <Badge
        variant={alert.severity === 'critical' ? 'destructive' : 'warning'}
        className="ml-2 shrink-0"
      >
        {alert.severity === 'critical' ? '危険' : '注意'}
      </Badge>
    </Link>
  )
}
