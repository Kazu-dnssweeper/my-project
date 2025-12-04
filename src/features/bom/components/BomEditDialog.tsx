'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { useUpdateBom } from '../hooks/useBom'
import type { BomWithItems, BomUpdateData } from '../types'

const bomUpdateSchema = z.object({
  quantity: z
    .string()
    .min(1, '数量を入力してください')
    .refine((val) => {
      const num = parseFloat(val)
      return !isNaN(num) && num > 0
    }, '数量は正の数で入力してください'),
  version: z.string().min(1, 'バージョンを入力してください'),
  effective_from: z.string().optional(),
  effective_to: z.string().optional(),
})

type FormInput = {
  quantity: string
  version: string
  effective_from?: string
  effective_to?: string
}

interface BomEditDialogProps {
  bom: BomWithItems
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function BomEditDialog({
  bom,
  open,
  onOpenChange,
  onSuccess,
}: BomEditDialogProps) {
  const { mutate: updateBom, isPending } = useUpdateBom()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(bomUpdateSchema),
    defaultValues: {
      quantity: String(bom.quantity),
      version: bom.version,
      effective_from: bom.effective_from || '',
      effective_to: bom.effective_to || '',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        quantity: String(bom.quantity),
        version: bom.version,
        effective_from: bom.effective_from || '',
        effective_to: bom.effective_to || '',
      })
    }
  }, [open, bom, reset])

  const onSubmit = (data: FormInput) => {
    const updateData: BomUpdateData = {
      quantity: parseFloat(data.quantity),
      version: data.version,
      effective_from: data.effective_from || null,
      effective_to: data.effective_to || null,
    }

    updateBom(
      { id: bom.id, data: updateData },
      {
        onSuccess: () => {
          onOpenChange(false)
          onSuccess?.()
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>BOM編集</DialogTitle>
          <DialogDescription>
            {bom.parent_item?.name} → {bom.child_item?.name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">数量</Label>
              <Input
                id="quantity"
                type="number"
                step="0.001"
                {...register('quantity')}
                aria-invalid={!!errors.quantity}
              />
              {errors.quantity && (
                <p className="text-sm text-destructive">
                  {errors.quantity.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="version">バージョン</Label>
              <Input
                id="version"
                {...register('version')}
                aria-invalid={!!errors.version}
              />
              {errors.version && (
                <p className="text-sm text-destructive">
                  {errors.version.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="effective_from">有効開始日</Label>
                <Input
                  id="effective_from"
                  type="date"
                  {...register('effective_from')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="effective_to">有効終了日</Label>
                <Input
                  id="effective_to"
                  type="date"
                  {...register('effective_to')}
                />
              </div>
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
            <Button type="submit" disabled={isPending}>
              {isPending && <Spinner size="sm" className="mr-2" />}
              保存
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
