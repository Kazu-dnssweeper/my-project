'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/layouts/PageHeader'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import {
  TransactionTable,
  TransactionFilters,
  useTransactions,
} from '@/features/transaction'
import type { TransactionFilters as TxFilters } from '@/features/transaction'

export default function TransactionsPage() {
  const [filters, setFilters] = useState<TxFilters>({})
  const [page, setPage] = useState(1)
  const limit = 20

  const { data, isLoading } = useTransactions(filters, page, limit)

  const handleFiltersChange = useCallback((newFilters: TxFilters) => {
    setFilters(newFilters)
    setPage(1)
  }, [])

  return (
    <div className="space-y-6">
      <PageHeader
        title="取引履歴"
        description="入出庫の履歴を確認できます"
        actions={
          <Button asChild>
            <Link href="/transactions/new">
              <Plus className="h-4 w-4 mr-2" />
              入出庫登録
            </Link>
          </Button>
        }
      />

      <TransactionFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      <TransactionTable
        transactions={data?.data || []}
        isLoading={isLoading}
      />

      {data && data.total > limit && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {data.total}件中 {(page - 1) * limit + 1}-
            {Math.min(page * limit, data.total)}件を表示
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              前へ
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page * limit >= data.total}
              onClick={() => setPage((p) => p + 1)}
            >
              次へ
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
