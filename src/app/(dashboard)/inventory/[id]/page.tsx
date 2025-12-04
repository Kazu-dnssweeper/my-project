'use client'

import { use } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/layouts/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowLeft, Edit, Plus } from 'lucide-react'
import { useItem, useItemInventories } from '@/features/inventory'
import { useItemTransactions, TransactionTable } from '@/features/transaction'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface InventoryDetailPageProps {
  params: Promise<{ id: string }>
}

export default function InventoryDetailPage({ params }: InventoryDetailPageProps) {
  const { id } = use(params)
  const { data: item, isLoading: itemLoading } = useItem(id)
  const { data: inventories, isLoading: invLoading } = useItemInventories(id)
  const { data: transactions, isLoading: txLoading } = useItemTransactions(id, 10)

  const totalQuantity = inventories?.reduce((sum, inv) => sum + inv.quantity, 0) || 0

  if (itemLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[300px]" />
        </div>
      </div>
    )
  }

  if (!item) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">部品が見つかりません</p>
        <Button asChild className="mt-4">
          <Link href="/inventory">一覧に戻る</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={item.name}
        description={`品番: ${item.item_code}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/inventory">
                <ArrowLeft className="h-4 w-4 mr-2" />
                一覧へ
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/transactions/new?item=${id}`}>
                <Plus className="h-4 w-4 mr-2" />
                入出庫
              </Link>
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 基本情報 */}
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted-foreground">品番</dt>
                <dd className="font-mono font-medium">{item.item_code}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">品名</dt>
                <dd className="font-medium">{item.name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">型番</dt>
                <dd>{item.model_number || '-'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">カテゴリ</dt>
                <dd>{item.category?.name || '-'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">単位</dt>
                <dd>{item.unit}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">保管場所</dt>
                <dd>{item.location || '-'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">安全在庫</dt>
                <dd>{item.safety_stock?.toLocaleString() || '-'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">発注点</dt>
                <dd>{item.reorder_point?.toLocaleString() || '-'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">リードタイム</dt>
                <dd>{item.lead_time_days ? `${item.lead_time_days}日` : '-'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">総在庫数</dt>
                <dd className="text-lg font-bold">
                  {totalQuantity.toLocaleString()} {item.unit}
                </dd>
              </div>
            </dl>
            {item.notes && (
              <div className="mt-4 pt-4 border-t">
                <dt className="text-sm text-muted-foreground mb-1">備考</dt>
                <dd className="text-sm whitespace-pre-wrap">{item.notes}</dd>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ロット別在庫 */}
        <Card>
          <CardHeader>
            <CardTitle>ロット別在庫</CardTitle>
          </CardHeader>
          <CardContent>
            {invLoading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : inventories && inventories.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>倉庫</TableHead>
                    <TableHead>ロット</TableHead>
                    <TableHead className="text-right">数量</TableHead>
                    <TableHead>入庫日</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventories.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>{inv.warehouse?.name || '-'}</TableCell>
                      <TableCell className="font-mono">
                        {inv.lot_number || '-'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {inv.quantity.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {inv.received_date
                          ? format(new Date(inv.received_date), 'yyyy/MM/dd', {
                              locale: ja,
                            })
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center py-8 text-muted-foreground">
                在庫がありません
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 取引履歴 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>取引履歴</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/transactions?item=${id}`}>すべて表示</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <TransactionTable
            transactions={transactions || []}
            isLoading={txLoading}
            showItem={false}
          />
        </CardContent>
      </Card>
    </div>
  )
}
