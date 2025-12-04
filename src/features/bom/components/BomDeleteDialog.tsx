'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { AlertTriangle } from 'lucide-react'
import { useDeleteBom } from '../hooks/useBom'
import type { BomWithItems } from '../types'

interface BomDeleteDialogProps {
  bom: BomWithItems
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function BomDeleteDialog({
  bom,
  open,
  onOpenChange,
  onSuccess,
}: BomDeleteDialogProps) {
  const { mutate: deleteBom, isPending } = useDeleteBom()

  const handleDelete = () => {
    deleteBom(bom.id, {
      onSuccess: () => {
        onOpenChange(false)
        onSuccess?.()
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            BOMを削除
          </DialogTitle>
          <DialogDescription>
            この操作は取り消せません。本当に削除しますか？
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="rounded-lg border p-4 bg-muted/50">
            <p className="text-sm font-medium">削除対象：</p>
            <p className="text-sm text-muted-foreground mt-1">
              親部品：{bom.parent_item?.name} ({bom.parent_item?.item_code})
            </p>
            <p className="text-sm text-muted-foreground">
              子部品：{bom.child_item?.name} ({bom.child_item?.item_code})
            </p>
            <p className="text-sm text-muted-foreground">
              数量：{bom.quantity} | バージョン：{bom.version}
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            キャンセル
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending && <Spinner size="sm" className="mr-2" />}
            削除
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
