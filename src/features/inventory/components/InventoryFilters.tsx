'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, X } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'
import { useCategories } from '../hooks/useItems'
import type { ItemFilters } from '../types'

interface InventoryFiltersProps {
  filters: ItemFilters
  onFiltersChange: (filters: ItemFilters) => void
}

export function InventoryFilters({
  filters,
  onFiltersChange,
}: InventoryFiltersProps) {
  const [search, setSearch] = useState(filters.search || '')
  const debouncedSearch = useDebounce(search, 300)
  const { data: categories } = useCategories()

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFiltersChange({ ...filters, search: debouncedSearch || undefined })
    }
  }, [debouncedSearch, filters, onFiltersChange])

  const handleCategoryChange = (value: string) => {
    onFiltersChange({
      ...filters,
      category_id: value === 'all' ? undefined : value,
    })
  }

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      stock_status: value as ItemFilters['stock_status'],
    })
  }

  const handleClear = () => {
    setSearch('')
    onFiltersChange({})
  }

  const hasFilters = search || filters.category_id || (filters.stock_status && filters.stock_status !== 'all')

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="品番・品名で検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select
        value={filters.category_id || 'all'}
        onValueChange={handleCategoryChange}
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="カテゴリ" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">すべてのカテゴリ</SelectItem>
          {categories?.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.stock_status || 'all'}
        onValueChange={handleStatusChange}
      >
        <SelectTrigger className="w-full sm:w-[150px]">
          <SelectValue placeholder="在庫状態" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">すべて</SelectItem>
          <SelectItem value="ok">正常</SelectItem>
          <SelectItem value="warning">注意</SelectItem>
          <SelectItem value="low">要発注</SelectItem>
          <SelectItem value="out">欠品</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={handleClear}>
          <X className="h-4 w-4 mr-1" />
          クリア
        </Button>
      )}
    </div>
  )
}
