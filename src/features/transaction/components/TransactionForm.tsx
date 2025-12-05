'use client'

import { useState } from 'react'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { useItems, useWarehouses } from '@/features/inventory'
import { useCreateTransaction } from '../hooks/useTransactions'
import type { TransactionType, TransactionSubType } from '../types'

const transactionSchema = z.object({
  item_id: z.string().min(1, '部品を選択してください'),
  warehouse_id: z.string().min(1, '倉庫を選択してください'),
  type: z.enum(['IN', 'OUT', 'MOVE']),
  sub_type: z.string().optional(),
  quantity: z.coerce.number().min(1, '数量は1以上で入力してください'),
  lot_number: z.string().optional(),
  note: z.string().optional(),
  to_warehouse_id: z.string().optional(),
})

interface TransactionFormData {
  item_id: string
  warehouse_id: string
  type: 'IN' | 'OUT' | 'MOVE'
  sub_type?: string
  quantity: number
  lot_number?: string
  note?: string
  to_warehouse_id?: string
}

const subTypeOptions: Record<TransactionType, { value: TransactionSubType; label: string }[]> = {
  IN: [
    { value: 'purchase', label: '仕入' },
    { value: 'production', label: '製造' },
    { value: 'return_in', label: '返品入庫' },
    { value: 'adjustment_in', label: '棚卸増' },
  ],
  OUT: [
    { value: 'sales', label: '販売' },
    { value: 'consumption', label: '消費' },
    { value: 'return_out', label: '返品出庫' },
    { value: 'scrap', label: '廃棄' },
    { value: 'adjustment_out', label: '棚卸減' },
  ],
  MOVE: [
    { value: 'transfer', label: '移動' },
  ],
}

interface TransactionFormProps {
  defaultType?: TransactionType
  onSuccess?: () => void
}

export function TransactionForm({
  defaultType = 'IN',
  onSuccess,
}: TransactionFormProps) {
  const [itemSearch, setItemSearch] = useState('')
  const { data: itemsData, isLoading: itemsLoading } = useItems(
    { search: itemSearch },
    1,
    50
  )
  const { data: warehouses } = useWarehouses()
  const createTransaction = useCreateTransaction()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema) as never,
    defaultValues: {
      type: defaultType,
      quantity: 1,
    },
  })

  const selectedType = watch('type') as TransactionType
  const selectedWarehouse = watch('warehouse_id')

  const onSubmit = async (data: TransactionFormData) => {
    try {
      await createTransaction.mutateAsync({
        item_id: data.item_id,
        warehouse_id: data.warehouse_id,
        type: data.type as TransactionType,
        sub_type: data.sub_type as TransactionSubType | undefined,
        quantity: data.quantity,
        lot_number: data.lot_number,
        note: data.note,
        to_warehouse_id: data.to_warehouse_id,
      })
      reset()
      onSuccess?.()
    } catch (error) {
      console.error('Failed to create transaction:', error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>入出庫登録</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* 取引種別 */}
          <div className="grid grid-cols-3 gap-2">
            {(['IN', 'OUT', 'MOVE'] as const).map((type) => (
              <Button
                key={type}
                type="button"
                variant={selectedType === type ? 'default' : 'outline'}
                className="w-full"
                onClick={() => {
                  setValue('type', type)
                  setValue('sub_type', '')
                }}
              >
                {type === 'IN' ? '入庫' : type === 'OUT' ? '出庫' : '移動'}
              </Button>
            ))}
          </div>

          {/* 詳細種別 */}
          <div className="space-y-2">
            <Label>詳細種別</Label>
            <Select
              value={watch('sub_type') || ''}
              onValueChange={(value) => setValue('sub_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                {subTypeOptions[selectedType]?.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 部品選択 */}
          <div className="space-y-2">
            <Label htmlFor="item_id">部品 *</Label>
            <Select
              value={watch('item_id') || ''}
              onValueChange={(value) => setValue('item_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="部品を選択..." />
              </SelectTrigger>
              <SelectContent>
                <div className="p-2">
                  <Input
                    placeholder="品番・品名で検索..."
                    value={itemSearch}
                    onChange={(e) => setItemSearch(e.target.value)}
                    className="mb-2"
                  />
                </div>
                {itemsLoading ? (
                  <div className="p-4 text-center">
                    <Spinner className="h-4 w-4 mx-auto" />
                  </div>
                ) : (
                  itemsData?.data.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      <span className="font-mono">{item.item_code}</span>
                      <span className="ml-2">{item.name}</span>
                      <span className="ml-2 text-muted-foreground">
                        (在庫: {item.total_quantity} {item.unit})
                      </span>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {errors.item_id && (
              <p className="text-sm text-destructive">{errors.item_id.message}</p>
            )}
          </div>

          {/* 倉庫選択 */}
          <div className="space-y-2">
            <Label htmlFor="warehouse_id">
              {selectedType === 'MOVE' ? '移動元倉庫' : '倉庫'} *
            </Label>
            <Select
              value={watch('warehouse_id') || ''}
              onValueChange={(value) => setValue('warehouse_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="倉庫を選択..." />
              </SelectTrigger>
              <SelectContent>
                {warehouses?.map((wh) => (
                  <SelectItem key={wh.id} value={wh.id}>
                    {wh.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.warehouse_id && (
              <p className="text-sm text-destructive">
                {errors.warehouse_id.message}
              </p>
            )}
          </div>

          {/* 移動先倉庫（MOVEの場合） */}
          {selectedType === 'MOVE' && (
            <div className="space-y-2">
              <Label htmlFor="to_warehouse_id">移動先倉庫 *</Label>
              <Select
                value={watch('to_warehouse_id') || ''}
                onValueChange={(value) => setValue('to_warehouse_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="移動先を選択..." />
                </SelectTrigger>
                <SelectContent>
                  {warehouses
                    ?.filter((wh) => wh.id !== selectedWarehouse)
                    .map((wh) => (
                      <SelectItem key={wh.id} value={wh.id}>
                        {wh.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 数量・ロット番号 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">数量 *</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                {...register('quantity')}
              />
              {errors.quantity && (
                <p className="text-sm text-destructive">
                  {errors.quantity.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="lot_number">ロット番号</Label>
              <Input
                id="lot_number"
                {...register('lot_number')}
                placeholder="任意"
              />
            </div>
          </div>

          {/* 備考 */}
          <div className="space-y-2">
            <Label htmlFor="note">備考</Label>
            <textarea
              id="note"
              className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm"
              {...register('note')}
              placeholder="任意のメモ..."
            />
          </div>

          {/* 送信ボタン */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || createTransaction.isPending}
          >
            {(isSubmitting || createTransaction.isPending) && (
              <Spinner className="mr-2 h-4 w-4" />
            )}
            {selectedType === 'IN' ? '入庫登録' : selectedType === 'OUT' ? '出庫登録' : '移動登録'}
          </Button>

          {createTransaction.isError && (
            <p className="text-sm text-destructive text-center">
              エラー: {(createTransaction.error as Error).message}
            </p>
          )}

          {createTransaction.isSuccess && (
            <p className="text-sm text-green-600 text-center">
              登録が完了しました
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
