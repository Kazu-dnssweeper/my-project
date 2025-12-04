import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface KPICardProps {
  title: string
  value: number | string
  unit?: string
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  variant?: 'default' | 'warning' | 'danger'
  isLoading?: boolean
}

export function KPICard({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  variant = 'default',
  isLoading,
}: KPICardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={cn(
        variant === 'warning' && 'border-yellow-500/50 bg-yellow-50/50 dark:bg-yellow-950/20',
        variant === 'danger' && 'border-red-500/50 bg-red-50/50 dark:bg-red-950/20'
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon
          className={cn(
            'h-4 w-4',
            variant === 'default' && 'text-muted-foreground',
            variant === 'warning' && 'text-yellow-600',
            variant === 'danger' && 'text-red-600'
          )}
        />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1">
          <span
            className={cn(
              'text-2xl font-bold',
              variant === 'warning' && 'text-yellow-700 dark:text-yellow-400',
              variant === 'danger' && 'text-red-700 dark:text-red-400'
            )}
          >
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
          {unit && (
            <span className="text-sm text-muted-foreground">{unit}</span>
          )}
        </div>
        {trend && (
          <p
            className={cn(
              'text-xs mt-1',
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            )}
          >
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% 前期比
          </p>
        )}
      </CardContent>
    </Card>
  )
}
