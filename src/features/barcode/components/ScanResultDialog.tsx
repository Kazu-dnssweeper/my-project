'use client'

import Link from 'next/link'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Package, ArrowDownLeft, ArrowUpRight, Plus, ExternalLink, Search } from 'lucide-react'
import type { ScanResult } from '../types'

interface ScanResultDialogProps {
  result: ScanResult
  open: boolean
  onOpenChange: (open: boolean) => void
  onAction?: (action: 'view' | 'in' | 'out' | 'new') => void
}

export function ScanResultDialog({
  result,
  open,
  onOpenChange,
  onAction,
}: ScanResultDialogProps) {
  if (!result.found) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-muted-foreground" />
              部品が見つかりません
            </DialogTitle>
            <DialogDescription>
              スキャンしたコード: {result.code}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Card className="bg-muted/50">
              <CardContent className="p-4 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  このコードに一致する部品が見つかりませんでした
                </p>
              </CardContent>
            </Card>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              閉じる
            </Button>
            <Button asChild className="w-full sm:w-auto">
              <Link href={`/inventory/new?code=${encodeURIComponent(result.code)}`}>
                <Plus className="mr-2 h-4 w-4" />
                新規登録
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  const item = result.item!

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            部品が見つかりました
          </DialogTitle>
          <DialogDescription>
            スキャンしたコード: {result.code}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.item_code}
                    {item.model_number && ` / ${item.model_number}`}
                  </p>
                </div>
                <Badge variant="secondary">{item.unit}</Badge>
              </div>
              {item.location && (
                <p className="text-sm mt-2">
                  <span className="text-muted-foreground">保管場所: </span>
                  {item.location}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            asChild
            className="w-full sm:w-auto"
          >
            <Link href={`/inventory/${item.id}`}>
              <ExternalLink className="mr-2 h-4 w-4" />
              詳細を見る
            </Link>
          </Button>
          <Button
            variant="outline"
            asChild
            className="w-full sm:w-auto"
          >
            <Link href={`/transactions/new?type=IN&item=${item.id}`}>
              <ArrowDownLeft className="mr-2 h-4 w-4" />
              入庫
            </Link>
          </Button>
          <Button asChild className="w-full sm:w-auto">
            <Link href={`/transactions/new?type=OUT&item=${item.id}`}>
              <ArrowUpRight className="mr-2 h-4 w-4" />
              出庫
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
