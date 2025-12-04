'use client'

import { Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAlertCount } from '../hooks/useAlertCount'

interface AlertBadgeProps {
  className?: string
}

export function AlertBadge({ className }: AlertBadgeProps) {
  const { data: count } = useAlertCount()

  const hasAlerts = count && count.unread > 0

  return (
    <div className={cn('relative', className)}>
      <Bell
        className={cn(
          'h-5 w-5',
          hasAlerts ? 'text-foreground' : 'text-muted-foreground'
        )}
      />
      {hasAlerts && (
        <span
          className={cn(
            'absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium text-white',
            count.critical > 0 ? 'bg-red-500' : 'bg-yellow-500'
          )}
        >
          {count.unread > 99 ? '99+' : count.unread}
        </span>
      )}
    </div>
  )
}
