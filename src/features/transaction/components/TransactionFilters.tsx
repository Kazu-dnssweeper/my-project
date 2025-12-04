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
import { Search, X, Calendar } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'
import type { TransactionFilters as TxFilters } from '../types'

interface TransactionFiltersProps {
  filters: TxFilters
  onFiltersChange: (filters: TxFilters) => void
}

export function TransactionFilters({
  filters,
  onFiltersChange,
}: TransactionFiltersProps) {
  const [search, setSearch] = useState(filters.search || '')
  const debouncedSearch = useDebounce(search, 300)

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFiltersChange({ ...filters, search: debouncedSearch || undefined })
    }
  }, [debouncedSearch, filters, onFiltersChange])

  const handleTypeChange = (value: string) => {
    onFiltersChange({
      ...filters,
      type: value === 'all' ? undefined : (value as TxFilters['type']),
    })
  }

  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      date_from: e.target.value || undefined,
    })
  }

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      date_to: e.target.value || undefined,
    })
  }

  const handleClear = () => {
    setSearch('')
    onFiltersChange({})
  }

  const hasFilters =
    search ||
    (filters.type && filters.type !== 'all') ||
    filters.date_from ||
    filters.date_to

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:flex-wrap">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="品番・品名で検索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Select
        value={filters.type || 'all'}
        onValueChange={handleTypeChange}
      >
        <SelectTrigger className="w-full sm:w-[140px]">
          <SelectValue placeholder="種別" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">すべて</SelectItem>
          <SelectItem value="IN">入庫</SelectItem>
          <SelectItem value="OUT">出庫</SelectItem>
          <SelectItem value="MOVE">移動</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <Input
          type="date"
          value={filters.date_from || ''}
          onChange={handleDateFromChange}
          className="w-[140px]"
        />
        <span className="text-muted-foreground">〜</span>
        <Input
          type="date"
          value={filters.date_to || ''}
          onChange={handleDateToChange}
          className="w-[140px]"
        />
      </div>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={handleClear}>
          <X className="h-4 w-4 mr-1" />
          クリア
        </Button>
      )}
    </div>
  )
}
