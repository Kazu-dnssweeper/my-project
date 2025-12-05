'use client'

import { memo, useMemo } from 'react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/date'
import { useLots } from '../hooks/useLot'
import type { LotSummary } from '../types'

export function LotTable() {
  const { data: lots, isLoading } = useLots()

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (!lots || lots.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        ロットデータがありません
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ロット番号</TableHead>
          <TableHead>部品</TableHead>
          <TableHead>倉庫</TableHead>
          <TableHead className="text-right">数量</TableHead>
          <TableHead>入庫日</TableHead>
          <TableHead>有効期限</TableHead>
          <TableHead>状態</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lots.map((lot) => (
          <LotRow key={`${lot.lot_number}-${lot.item.id}`} lot={lot} />
        ))}
      </TableBody>
    </Table>
  )
}

interface LotRowProps {
  lot: LotSummary
}

const LotRow = memo(function LotRow({ lot }: LotRowProps) {
  const formattedReceivedDate = useMemo(
    () => formatDate(lot.received_date),
    [lot.received_date]
  )

  const formattedExpiryDate = useMemo(
    () => formatDate(lot.expiry_date),
    [lot.expiry_date]
  )

  const expiryText = useMemo(() => {
    if (lot.daysUntilExpiry === null || !lot.expiry_date) return null
    return lot.daysUntilExpiry < 0
      ? `${Math.abs(lot.daysUntilExpiry)}日経過`
      : `残り${lot.daysUntilExpiry}日`
  }, [lot.daysUntilExpiry, lot.expiry_date])

  const expiryClassName = lot.isExpired
    ? 'text-destructive'
    : lot.isExpiringSoon
      ? 'text-yellow-600'
      : ''

  const statusBadge = lot.isExpired ? (
    <Badge variant="destructive">期限切れ</Badge>
  ) : lot.isExpiringSoon ? (
    <Badge variant="warning">期限間近</Badge>
  ) : (
    <Badge variant="success">正常</Badge>
  )

  return (
    <TableRow>
      <TableCell>
        <Link
          href={`/lots/${lot.item.id}`}
          className="font-medium text-primary hover:underline"
        >
          {lot.lot_number}
        </Link>
      </TableCell>
      <TableCell>
        <div>
          <p className="font-medium">{lot.item.name}</p>
          <p className="text-xs text-muted-foreground">{lot.item.item_code}</p>
        </div>
      </TableCell>
      <TableCell>{lot.warehouse?.name || '-'}</TableCell>
      <TableCell className="text-right">
        {lot.quantity.toLocaleString()} {lot.item.unit}
      </TableCell>
      <TableCell>{formattedReceivedDate}</TableCell>
      <TableCell className={expiryClassName}>
        {formattedExpiryDate}
        {expiryText && <span className="text-xs ml-1">({expiryText})</span>}
      </TableCell>
      <TableCell>{statusBadge}</TableCell>
    </TableRow>
  )
})
