'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Lightbulb, ArrowRight } from 'lucide-react'
import { useFifoSuggestions } from '../hooks/useLot'
import type { FifoSuggestion as FifoSuggestionType } from '../types'

interface FifoSuggestionProps {
  itemId: string
  quantity: number
  onSelect?: (suggestion: FifoSuggestionType) => void
}

export function FifoSuggestion({
  itemId,
  quantity,
  onSelect,
}: FifoSuggestionProps) {
  const { data: suggestions, isLoading } = useFifoSuggestions(itemId, quantity)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-5 w-5" />
            FIFO提案
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!suggestions || suggestions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-5 w-5" />
            FIFO提案
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            利用可能なロットがありません
          </p>
        </CardContent>
      </Card>
    )
  }

  const totalSuggested = suggestions.reduce(
    (sum, s) => sum + s.suggestedQuantity,
    0
  )
  const isShortage = totalSuggested < quantity

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-base">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            FIFO提案
          </span>
          {isShortage && (
            <Badge variant="warning">
              不足: {quantity - totalSuggested}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <div
            key={`${suggestion.lot.id}-${index}`}
            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => onSelect?.(suggestion)}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">{suggestion.lot.lot_number}</p>
                <Badge variant="secondary" className="text-xs">
                  在庫: {suggestion.lot.quantity}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {suggestion.reason}
              </p>
            </div>
            <div className="flex items-center gap-2 text-primary">
              <span className="font-semibold">
                {suggestion.suggestedQuantity}
              </span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        ))}

        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">提案合計</span>
            <span className="font-semibold">{totalSuggested}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-muted-foreground">必要数量</span>
            <span className="font-semibold">{quantity}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
