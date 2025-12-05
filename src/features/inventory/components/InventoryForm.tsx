'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { useCategories, useCreateItem, useUpdateItem } from '../hooks/useItems'
import type { Item } from '@/types'

const itemSchema = z.object({
  item_code: z.string().min(1, '品番を入力してください'),
  name: z.string().min(1, '品名を入力してください'),
  model_number: z.string().optional(),
  category_id: z.string().optional(),
  unit: z.string().min(1, '単位を入力してください'),
  safety_stock: z.coerce.number().min(0).optional(),
  reorder_point: z.coerce.number().min(0).optional(),
  lead_time_days: z.coerce.number().min(0).optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
})

interface ItemFormData {
  item_code: string
  name: string
  model_number?: string
  category_id?: string
  unit: string
  safety_stock?: number
  reorder_point?: number
  lead_time_days?: number
  location?: string
  notes?: string
}

interface InventoryFormProps {
  item?: Item | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function InventoryForm({
  item,
  open,
  onOpenChange,
  onSuccess,
}: InventoryFormProps) {
  const { data: categories } = useCategories()
  const createItem = useCreateItem()
  const updateItem = useUpdateItem()
  const isEditing = !!item

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema) as never,
    defaultValues: {
      item_code: item?.item_code || '',
      name: item?.name || '',
      model_number: item?.model_number || '',
      category_id: item?.category_id || undefined,
      unit: item?.unit || '個',
      safety_stock: item?.safety_stock ?? undefined,
      reorder_point: item?.reorder_point ?? undefined,
      lead_time_days: item?.lead_time_days ?? undefined,
      location: item?.location || '',
      notes: item?.notes || '',
    },
  })

  const onSubmit = async (data: ItemFormData) => {
    try {
      if (isEditing && item) {
        await updateItem.mutateAsync({ id: item.id, data })
      } else {
        await createItem.mutateAsync(data)
      }
      reset()
      onOpenChange(false)
      onSuccess?.()
    } catch (error) {
      console.error('Failed to save item:', error)
    }
  }

  const categoryId = watch('category_id')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? '部品を編集' : '新規部品登録'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="item_code">品番 *</Label>
              <Input
                id="item_code"
                {...register('item_code')}
                disabled={isEditing}
              />
              {errors.item_code && (
                <p className="text-sm text-destructive">
                  {errors.item_code.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">品名 *</Label>
              <Input id="name" {...register('name')} />
              {errors.name && (
                <p className="text-sm text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="model_number">型番</Label>
              <Input id="model_number" {...register('model_number')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category_id">カテゴリ</Label>
              <Select
                value={categoryId || ''}
                onValueChange={(value) =>
                  setValue('category_id', value || undefined)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unit">単位 *</Label>
              <Input id="unit" {...register('unit')} />
              {errors.unit && (
                <p className="text-sm text-destructive">{errors.unit.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="safety_stock">安全在庫</Label>
              <Input
                id="safety_stock"
                type="number"
                min={0}
                {...register('safety_stock')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorder_point">発注点</Label>
              <Input
                id="reorder_point"
                type="number"
                min={0}
                {...register('reorder_point')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lead_time_days">リードタイム（日）</Label>
              <Input
                id="lead_time_days"
                type="number"
                min={0}
                {...register('lead_time_days')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">保管場所</Label>
              <Input id="location" {...register('location')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">備考</Label>
            <textarea
              id="notes"
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              {...register('notes')}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Spinner className="mr-2 h-4 w-4" />}
              {isEditing ? '更新' : '登録'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
