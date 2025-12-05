'use client'

import { useState, useCallback } from 'react'
import { PageHeader } from '@/components/layouts/PageHeader'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import {
  InventoryTable,
  InventoryFilters,
  InventoryForm,
  useItems,
} from '@/features/inventory'
import type { ItemFilters, ItemWithStock } from '@/features/inventory'

export default function InventoryPage() {
  const [filters, setFilters] = useState<ItemFilters>({})
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState('item_code')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [formOpen, setFormOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ItemWithStock | null>(null)

  const { data, isLoading, refetch } = useItems(
    filters,
    page,
    20,
    sortBy,
    sortOrder
  )

  const handleFiltersChange = useCallback((newFilters: ItemFilters) => {
    setFilters(newFilters)
    setPage(1)
  }, [])

  const handleSort = useCallback((column: string) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }, [sortBy])

  const handleEdit = useCallback((item: ItemWithStock) => {
    setEditingItem(item)
    setFormOpen(true)
  }, [])

  const handleFormClose = useCallback((open: boolean) => {
    setFormOpen(open)
    if (!open) {
      setEditingItem(null)
    }
  }, [])

  const handleFormSuccess = useCallback(() => {
    refetch()
  }, [refetch])

  return (
    <div className="space-y-6">
      <PageHeader
        title="在庫一覧"
        description="部品の在庫状況を確認・管理できます"
        actions={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            新規登録
          </Button>
        }
      />

      <InventoryFilters filters={filters} onFiltersChange={handleFiltersChange} />

      <InventoryTable
        items={data?.data || []}
        isLoading={isLoading}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        onEdit={handleEdit}
      />

      {data && data.total > 20 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {data.total}件中 {(page - 1) * 20 + 1}-{Math.min(page * 20, data.total)}件を表示
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
              disabled={page * 20 >= data.total}
              onClick={() => setPage((p) => p + 1)}
            >
              次へ
            </Button>
          </div>
        </div>
      )}

      <InventoryForm
        item={editingItem}
        open={formOpen}
        onOpenChange={handleFormClose}
        onSuccess={handleFormSuccess}
      />
    </div>
  )
}
