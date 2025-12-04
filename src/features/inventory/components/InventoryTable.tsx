'use client'

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
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronUp, ChevronDown, Eye, Edit } from 'lucide-react'
import type { ItemWithStock } from '../types'

interface InventoryTableProps {
  items: ItemWithStock[]
  isLoading?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  onSort?: (column: string) => void
  onEdit?: (item: ItemWithStock) => void
}

const stockStatusVariant = {
  ok: 'default',
  warning: 'secondary',
  low: 'destructive',
  out: 'outline',
} as const

const stockStatusLabel = {
  ok: '正常',
  warning: '注意',
  low: '要発注',
  out: '欠品',
} as const

export function InventoryTable({
  items,
  isLoading,
  sortBy,
  sortOrder,
  onSort,
  onEdit,
}: InventoryTableProps) {
  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return null
    return sortOrder === 'asc' ? (
      <ChevronUp className="ml-1 h-4 w-4 inline" />
    ) : (
      <ChevronDown className="ml-1 h-4 w-4 inline" />
    )
  }

  const SortableHeader = ({
    column,
    children,
  }: {
    column: string
    children: React.ReactNode
  }) => (
    <TableHead
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => onSort?.(column)}
    >
      {children}
      <SortIcon column={column} />
    </TableHead>
  )

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        部品が見つかりませんでした
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader column="item_code">品番</SortableHeader>
            <SortableHeader column="name">品名</SortableHeader>
            <TableHead>カテゴリ</TableHead>
            <SortableHeader column="quantity">在庫数</SortableHeader>
            <TableHead>単位</TableHead>
            <TableHead>ステータス</TableHead>
            <TableHead className="w-[100px]">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-mono">{item.item_code}</TableCell>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>{item.category?.name || '-'}</TableCell>
              <TableCell className="text-right tabular-nums">
                {item.total_quantity.toLocaleString()}
              </TableCell>
              <TableCell>{item.unit}</TableCell>
              <TableCell>
                <Badge variant={stockStatusVariant[item.stock_status]}>
                  {stockStatusLabel[item.stock_status]}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/inventory/${item.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit?.(item)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
