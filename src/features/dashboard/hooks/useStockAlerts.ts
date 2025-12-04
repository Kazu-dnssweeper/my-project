'use client'

import { useQuery } from '@tanstack/react-query'
import { getStockAlerts } from '../api'

export function useStockAlerts(limit = 10) {
  return useQuery({
    queryKey: ['dashboard', 'alerts', limit],
    queryFn: () => getStockAlerts(limit),
    refetchInterval: 60000, // 1分ごとに更新
  })
}
