'use client'

import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertTriangle, Package, Calendar, ExternalLink } from 'lucide-react'
import { AlertBadge } from './AlertBadge'
import { useAlerts } from '../hooks/useAlerts'
import type { Alert } from '../types'

export function AlertDropdown() {
  const { data: alerts, isLoading } = useAlerts()

  const displayAlerts = alerts?.slice(0, 5) || []

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <AlertBadge />
          <span className="sr-only">通知を表示</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>通知</span>
          {alerts && alerts.length > 0 && (
            <Badge variant="secondary">{alerts.length}件</Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isLoading ? (
          <div className="p-2 space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : displayAlerts.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            通知はありません
          </div>
        ) : (
          <>
            {displayAlerts.map((alert) => (
              <AlertDropdownItem key={alert.id} alert={alert} />
            ))}
            {alerts && alerts.length > 5 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href="/alerts"
                    className="flex items-center justify-center gap-1 text-primary"
                  >
                    すべて表示
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </DropdownMenuItem>
              </>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function AlertDropdownItem({ alert }: { alert: Alert }) {
  const getIcon = () => {
    switch (alert.type) {
      case 'low_stock':
      case 'critical_stock':
        return (
          <Package
            className={
              alert.severity === 'critical' ? 'text-red-500' : 'text-yellow-500'
            }
          />
        )
      case 'expiry_warning':
      case 'expiry_critical':
        return (
          <Calendar
            className={
              alert.severity === 'critical' ? 'text-red-500' : 'text-yellow-500'
            }
          />
        )
      default:
        return <AlertTriangle className="text-muted-foreground" />
    }
  }

  return (
    <DropdownMenuItem asChild>
      <Link
        href={alert.itemId ? `/inventory/${alert.itemId}` : '/inventory'}
        className="flex items-start gap-3 p-2"
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted">
          {getIcon()}
        </div>
        <div className="flex-1 space-y-1 min-w-0">
          <p className="text-sm font-medium leading-none truncate">
            {alert.title}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {alert.message}
          </p>
        </div>
        <Badge
          variant={alert.severity === 'critical' ? 'destructive' : 'warning'}
          className="shrink-0"
        >
          {alert.severity === 'critical' ? '危険' : '注意'}
        </Badge>
      </Link>
    </DropdownMenuItem>
  )
}
