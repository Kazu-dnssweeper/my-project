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
import { format } from 'date-fns'
import { useBoms } from '../hooks/useBom'
import { BomActionMenu } from './BomActionMenu'
import type { BomWithItems } from '../types'

interface BomTableProps {
  parentItemId?: string
}

export function BomTable({ parentItemId }: BomTableProps) {
  const { data: boms, isLoading, refetch } = useBoms()

  const filteredBoms = parentItemId
    ? boms?.filter((b) => b.parent_item_id === parentItemId)
    : boms

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (!filteredBoms || filteredBoms.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        BOMデータがありません
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>親部品</TableHead>
          <TableHead>子部品</TableHead>
          <TableHead className="text-right">数量</TableHead>
          <TableHead>バージョン</TableHead>
          <TableHead>有効期間</TableHead>
          <TableHead className="w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredBoms.map((bom) => (
          <BomTableRow key={bom.id} bom={bom} onUpdate={() => refetch()} />
        ))}
      </TableBody>
    </Table>
  )
}

function BomTableRow({
  bom,
  onUpdate,
}: {
  bom: BomWithItems
  onUpdate: () => void
}) {
  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return format(new Date(date), 'yyyy/MM/dd')
  }

  return (
    <TableRow>
      <TableCell>
        <div>
          <p className="font-medium">{bom.parent_item?.name}</p>
          <p className="text-xs text-muted-foreground">
            {bom.parent_item?.item_code}
          </p>
        </div>
      </TableCell>
      <TableCell>
        <div>
          <p className="font-medium">{bom.child_item?.name}</p>
          <p className="text-xs text-muted-foreground">
            {bom.child_item?.item_code}
          </p>
        </div>
      </TableCell>
      <TableCell className="text-right">{bom.quantity}</TableCell>
      <TableCell>
        <Badge variant="secondary">{bom.version}</Badge>
      </TableCell>
      <TableCell>
        <span className="text-sm">
          {formatDate(bom.effective_from)} 〜 {formatDate(bom.effective_to)}
        </span>
      </TableCell>
      <TableCell>
        <BomActionMenu bom={bom} onSuccess={onUpdate} />
      </TableCell>
    </TableRow>
  )
}
