'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { useLots } from '../hooks/useLot'
import type { LotSummary } from '../types'

interface LotExpiryAlertProps {
  limit?: number
}

export function LotExpiryAlert({ limit = 5 }: LotExpiryAlertProps) {
  const { data: lots } = useLots()

  const expiringLots =
    lots?.filter((lot) => lot.isExpired || lot.isExpiringSoon).slice(0, limit) ||
    []

  if (expiringLots.length === 0) {
    return null
  }

  const expiredCount = expiringLots.filter((l) => l.isExpired).length
  const expiringCount = expiringLots.filter((l) => l.isExpiringSoon).length

  return (
    <Alert variant={expiredCount > 0 ? 'destructive' : 'warning'}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>有効期限アラート</AlertTitle>
      <AlertDescription>
        <p className="mb-2">
          {expiredCount > 0 && `${expiredCount}件の期限切れロット`}
          {expiredCount > 0 && expiringCount > 0 && '、'}
          {expiringCount > 0 && `${expiringCount}件の期限間近ロット`}
          があります
        </p>
        <div className="space-y-2">
          {expiringLots.map((lot) => (
            <LotExpiryItem key={`${lot.lot_number}-${lot.item.id}`} lot={lot} />
          ))}
        </div>
      </AlertDescription>
    </Alert>
  )
}

function LotExpiryItem({ lot }: { lot: LotSummary }) {
  return (
    <div className="flex items-center justify-between p-2 bg-background/50 rounded-lg">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">
          {lot.item.name} - {lot.lot_number}
        </p>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {lot.expiry_date
            ? format(new Date(lot.expiry_date), 'yyyy/MM/dd')
            : '-'}
          {lot.daysUntilExpiry !== null && (
            <span>
              ({lot.daysUntilExpiry < 0
                ? `${Math.abs(lot.daysUntilExpiry)}日経過`
                : `残り${lot.daysUntilExpiry}日`})
            </span>
          )}
        </p>
      </div>
      <Badge variant={lot.isExpired ? 'destructive' : 'warning'}>
        {lot.isExpired ? '期限切れ' : '期限間近'}
      </Badge>
    </div>
  )
}
