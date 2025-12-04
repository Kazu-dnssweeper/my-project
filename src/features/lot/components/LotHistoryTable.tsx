'use client'

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
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from 'lucide-react'
import { format } from 'date-fns'
import { useLot } from '../hooks/useLot'
import type { Transaction } from '@/types'

interface LotHistoryTableProps {
  lotId: string
}

export function LotHistoryTable({ lotId }: LotHistoryTableProps) {
  const { data: lot, isLoading } = useLot(lotId)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  const transactions = lot?.transactions || []

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        取引履歴がありません
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>種別</TableHead>
          <TableHead className="text-right">数量</TableHead>
          <TableHead>日時</TableHead>
          <TableHead>備考</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((tx) => (
          <TransactionRow key={tx.id} transaction={tx} />
        ))}
      </TableBody>
    </Table>
  )
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const getTypeIcon = () => {
    switch (transaction.type) {
      case 'IN':
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />
      case 'OUT':
        return <ArrowUpRight className="h-4 w-4 text-red-600" />
      case 'MOVE':
        return <ArrowLeftRight className="h-4 w-4 text-blue-600" />
      default:
        return null
    }
  }

  const getTypeBadge = () => {
    switch (transaction.type) {
      case 'IN':
        return <Badge variant="success">入庫</Badge>
      case 'OUT':
        return <Badge variant="destructive">出庫</Badge>
      case 'MOVE':
        return <Badge variant="secondary">移動</Badge>
      default:
        return <Badge>{transaction.type}</Badge>
    }
  }

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          {getTypeIcon()}
          {getTypeBadge()}
          {transaction.sub_type && (
            <span className="text-xs text-muted-foreground">
              ({transaction.sub_type})
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right font-medium">
        {transaction.type === 'OUT' ? '-' : '+'}
        {transaction.quantity.toLocaleString()}
      </TableCell>
      <TableCell>
        {format(new Date(transaction.transacted_at), 'yyyy/MM/dd HH:mm')}
      </TableCell>
      <TableCell className="max-w-xs truncate">
        {transaction.note || '-'}
      </TableCell>
    </TableRow>
  )
}
