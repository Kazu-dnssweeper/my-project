'use client'

import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
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
import { ArrowDownCircle, ArrowUpCircle, ArrowRightLeft } from 'lucide-react'
import type { TransactionWithDetails } from '../types'

interface TransactionTableProps {
  transactions: TransactionWithDetails[]
  isLoading?: boolean
  showItem?: boolean
}

const typeConfig = {
  IN: {
    label: '入庫',
    variant: 'default' as const,
    icon: ArrowDownCircle,
    color: 'text-green-600',
  },
  OUT: {
    label: '出庫',
    variant: 'destructive' as const,
    icon: ArrowUpCircle,
    color: 'text-red-600',
  },
  MOVE: {
    label: '移動',
    variant: 'secondary' as const,
    icon: ArrowRightLeft,
    color: 'text-blue-600',
  },
  ADJUST: {
    label: '調整',
    variant: 'outline' as const,
    icon: ArrowRightLeft,
    color: 'text-gray-600',
  },
}

const subTypeLabels: Record<string, string> = {
  purchase: '仕入',
  production: '製造',
  return_in: '返品入庫',
  adjustment_in: '棚卸増',
  sales: '販売',
  consumption: '消費',
  return_out: '返品出庫',
  scrap: '廃棄',
  adjustment_out: '棚卸減',
  transfer: '移動',
}

export function TransactionTable({
  transactions,
  isLoading,
  showItem = true,
}: TransactionTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        取引履歴がありません
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>日時</TableHead>
            <TableHead>種別</TableHead>
            {showItem && <TableHead>品番</TableHead>}
            {showItem && <TableHead>品名</TableHead>}
            <TableHead className="text-right">数量</TableHead>
            <TableHead>倉庫</TableHead>
            <TableHead>ロット</TableHead>
            <TableHead>備考</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => {
            const config = typeConfig[tx.type as keyof typeof typeConfig] || typeConfig.ADJUST
            const Icon = config.icon

            return (
              <TableRow key={tx.id}>
                <TableCell className="whitespace-nowrap">
                  {format(new Date(tx.transacted_at), 'MM/dd HH:mm', {
                    locale: ja,
                  })}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${config.color}`} />
                    <Badge variant={config.variant}>{config.label}</Badge>
                    {tx.sub_type && (
                      <span className="text-xs text-muted-foreground">
                        ({subTypeLabels[tx.sub_type] || tx.sub_type})
                      </span>
                    )}
                  </div>
                </TableCell>
                {showItem && (
                  <TableCell className="font-mono">{tx.item_code}</TableCell>
                )}
                {showItem && <TableCell>{tx.item_name}</TableCell>}
                <TableCell className="text-right tabular-nums font-medium">
                  <span className={config.color}>
                    {tx.type === 'IN' ? '+' : tx.type === 'OUT' ? '-' : ''}
                    {tx.quantity.toLocaleString()}
                  </span>
                </TableCell>
                <TableCell>{tx.warehouse_name || '-'}</TableCell>
                <TableCell className="font-mono text-sm">
                  {tx.lot_number || '-'}
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {tx.note || '-'}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
