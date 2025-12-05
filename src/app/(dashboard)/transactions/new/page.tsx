'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { PageHeader } from '@/components/layouts/PageHeader'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { TransactionForm } from '@/features/transaction'

export default function NewTransactionPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const itemId = searchParams.get('item')

  const handleSuccess = () => {
    if (itemId) {
      router.push(`/inventory/${itemId}`)
    } else {
      router.push('/transactions')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="入出庫登録"
        description="在庫の入庫・出庫・移動を記録します"
        actions={
          <Button variant="outline" asChild>
            <Link href="/transactions">
              <ArrowLeft className="h-4 w-4 mr-2" />
              履歴へ
            </Link>
          </Button>
        }
      />

      <div className="max-w-2xl">
        <TransactionForm onSuccess={handleSuccess} />
      </div>
    </div>
  )
}
