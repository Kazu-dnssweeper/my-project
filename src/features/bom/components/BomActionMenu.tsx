'use client'

import { useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { BomEditDialog } from './BomEditDialog'
import { BomDeleteDialog } from './BomDeleteDialog'
import type { BomWithItems } from '../types'

interface BomActionMenuProps {
  bom: BomWithItems
  onSuccess?: () => void
}

export function BomActionMenu({ bom, onSuccess }: BomActionMenuProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">アクション</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            編集
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setDeleteOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            削除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <BomEditDialog
        bom={bom}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={onSuccess}
      />
      <BomDeleteDialog
        bom={bom}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onSuccess={onSuccess}
      />
    </>
  )
}
