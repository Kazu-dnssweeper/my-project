'use client'

import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type StockStatus = 'ok' | 'warning' | 'low' | 'out'

interface StatusBadgeProps {
  status: StockStatus
  className?: string
}

const statusConfig: Record<
  StockStatus,
  { label: string; className: string }
> = {
  ok: {
    label: '適正',
    className: 'bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900 dark:text-green-200',
  },
  warning: {
    label: '注意',
    className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200',
  },
  low: {
    label: '不足',
    className: 'bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-900 dark:text-orange-200',
  },
  out: {
    label: '欠品',
    className: 'bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900 dark:text-red-200',
  },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <Badge variant="secondary" className={cn(config.className, className)}>
      {config.label}
    </Badge>
  )
}
