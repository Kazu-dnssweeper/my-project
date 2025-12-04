'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Package, MapPin, Calendar, Hash } from 'lucide-react'
import { format } from 'date-fns'
import { useLot } from '../hooks/useLot'

interface LotDetailCardProps {
  lotId: string
}

export function LotDetailCard({ lotId }: LotDetailCardProps) {
  const { data: lot, isLoading } = useLot(lotId)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    )
  }

  if (!lot) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          ロットが見つかりません
        </CardContent>
      </Card>
    )
  }

  const now = new Date()
  const expiryDate = lot.expiry_date ? new Date(lot.expiry_date) : null
  const isExpired = expiryDate ? expiryDate < now : false
  const isExpiringSoon = expiryDate
    ? expiryDate >= now &&
      expiryDate <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    : false

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return format(new Date(date), 'yyyy/MM/dd')
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5" />
            {lot.lot_number}
          </CardTitle>
          <div className="flex gap-2">
            {isExpired && <Badge variant="destructive">期限切れ</Badge>}
            {isExpiringSoon && <Badge variant="warning">期限間近</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <Package className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="font-medium">{lot.item?.name}</p>
            <p className="text-sm text-muted-foreground">
              {lot.item?.item_code}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <MapPin className="h-5 w-5 text-muted-foreground" />
          <p>{lot.warehouse?.name || '-'}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">数量</p>
            <p className="text-lg font-semibold">
              {lot.quantity.toLocaleString()} {lot.item?.unit}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">入庫日</p>
            <p className="flex items-center gap-1">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              {formatDate(lot.received_date)}
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">有効期限</p>
          <p
            className={
              isExpired
                ? 'text-destructive font-medium'
                : isExpiringSoon
                  ? 'text-yellow-600 font-medium'
                  : ''
            }
          >
            <Calendar className="h-4 w-4 inline mr-1" />
            {formatDate(lot.expiry_date)}
            {isExpired && ' (期限切れ)'}
            {isExpiringSoon && ' (期限間近)'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
