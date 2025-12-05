'use client'

import * as React from 'react'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { ja } from 'date-fns/locale'
import { TrendingUp, TrendingDown, ArrowRightLeft, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useTransactions } from '../hooks/useTransactions'
import type { TransactionWithDetails } from '../types'

type Period = '7days' | '30days' | '90days' | 'thisMonth' | 'lastMonth'

interface TransactionSummaryProps {
  className?: string
}

interface SummaryData {
  inCount: number
  inQuantity: number
  outCount: number
  outQuantity: number
  moveCount: number
  moveQuantity: number
}

const PERIODS: { value: Period; label: string }[] = [
  { value: '7days', label: '過去7日間' },
  { value: '30days', label: '過去30日間' },
  { value: '90days', label: '過去90日間' },
  { value: 'thisMonth', label: '今月' },
  { value: 'lastMonth', label: '先月' },
]

function getDateRange(period: Period): { from: string; to: string } {
  const now = new Date()
  let from: Date
  let to: Date = endOfDay(now)

  switch (period) {
    case '7days':
      from = startOfDay(subDays(now, 6))
      break
    case '30days':
      from = startOfDay(subDays(now, 29))
      break
    case '90days':
      from = startOfDay(subDays(now, 89))
      break
    case 'thisMonth':
      from = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1))
      break
    case 'lastMonth':
      from = startOfDay(new Date(now.getFullYear(), now.getMonth() - 1, 1))
      to = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0))
      break
    default:
      from = startOfDay(subDays(now, 6))
  }

  return {
    from: format(from, 'yyyy-MM-dd'),
    to: format(to, 'yyyy-MM-dd'),
  }
}

function calculateSummary(transactions: TransactionWithDetails[]): SummaryData {
  return transactions.reduce(
    (acc, tx) => {
      const qty = Number(tx.quantity) || 0
      switch (tx.type) {
        case 'IN':
          acc.inCount++
          acc.inQuantity += qty
          break
        case 'OUT':
          acc.outCount++
          acc.outQuantity += qty
          break
        case 'MOVE':
          acc.moveCount++
          acc.moveQuantity += qty
          break
      }
      return acc
    },
    { inCount: 0, inQuantity: 0, outCount: 0, outQuantity: 0, moveCount: 0, moveQuantity: 0 }
  )
}

export function TransactionSummary({ className }: TransactionSummaryProps) {
  const [period, setPeriod] = React.useState<Period>('7days')
  const dateRange = React.useMemo(() => getDateRange(period), [period])

  const { data, isLoading } = useTransactions(
    { date_from: dateRange.from, date_to: dateRange.to },
    1,
    1000 // Get all transactions for the period
  )

  const summary = React.useMemo(() => {
    if (!data?.data) return null
    return calculateSummary(data.data)
  }, [data?.data])

  const netChange = summary ? summary.inQuantity - summary.outQuantity : 0

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">入出庫サマリー</CardTitle>
        <Select value={period} onValueChange={(v: Period) => setPeriod(v)}>
          <SelectTrigger className="w-[140px] h-8">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIODS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : (
          <div className="space-y-3">
            {/* 入庫 */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-950">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900">
                  <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">入庫</p>
                  <p className="text-xs text-muted-foreground">{summary?.inCount ?? 0}件</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  +{summary?.inQuantity.toLocaleString() ?? 0}
                </p>
              </div>
            </div>

            {/* 出庫 */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-red-100 dark:bg-red-900">
                  <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">出庫</p>
                  <p className="text-xs text-muted-foreground">{summary?.outCount ?? 0}件</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-red-600 dark:text-red-400">
                  -{summary?.outQuantity.toLocaleString() ?? 0}
                </p>
              </div>
            </div>

            {/* 移動 */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900">
                  <ArrowRightLeft className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">移動</p>
                  <p className="text-xs text-muted-foreground">{summary?.moveCount ?? 0}件</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                  {summary?.moveQuantity.toLocaleString() ?? 0}
                </p>
              </div>
            </div>

            {/* 純増減 */}
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">純増減</span>
                <span
                  className={cn(
                    'text-lg font-bold',
                    netChange > 0 && 'text-green-600',
                    netChange < 0 && 'text-red-600',
                    netChange === 0 && 'text-muted-foreground'
                  )}
                >
                  {netChange > 0 ? '+' : ''}
                  {netChange.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
