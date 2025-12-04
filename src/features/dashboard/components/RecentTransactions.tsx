'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Clock, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { useRecentTransactions } from '../hooks/useRecentTransactions'
import type { RecentTransaction } from '../types'

interface RecentTransactionsProps {
  limit?: number
}

export function RecentTransactions({ limit = 5 }: RecentTransactionsProps) {
  const { data: transactions, isLoading } = useRecentTransactions(limit)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            最近の入出庫
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-5 w-12" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (!transactions || transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            最近の入出庫
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            取引履歴がありません
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          最近の入出庫
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {transactions.map((tx) => (
          <TransactionItem key={tx.id} transaction={tx} />
        ))}
        <Link
          href="/transactions"
          className="flex items-center justify-center gap-1 text-sm text-primary hover:underline pt-2"
        >
          すべて表示
          <ExternalLink className="h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  )
}

function TransactionItem({ transaction }: { transaction: RecentTransaction }) {
  const getTypeIcon = (type: string) => {
    switch (type) {
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

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'IN':
        return <Badge variant="success">入庫</Badge>
      case 'OUT':
        return <Badge variant="destructive">出庫</Badge>
      case 'MOVE':
        return <Badge variant="secondary">移動</Badge>
      default:
        return <Badge>{type}</Badge>
    }
  }

  return (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
          {getTypeIcon(transaction.type)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">
            {transaction.item_name || '不明な部品'}
          </p>
          <p className="text-xs text-muted-foreground">
            {transaction.item_code} | 数量: {transaction.quantity.toLocaleString()}
          </p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
        {getTypeBadge(transaction.type)}
        <span className="text-xs text-muted-foreground">
          {format(new Date(transaction.transacted_at), 'M/d HH:mm', { locale: ja })}
        </span>
      </div>
    </div>
  )
}
