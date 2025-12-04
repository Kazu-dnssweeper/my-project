'use client'

import { useQuery } from '@tanstack/react-query'
import { getDashboardKPI } from '../api'

export function useDashboardKPI() {
  return useQuery({
    queryKey: ['dashboard', 'kpi'],
    queryFn: getDashboardKPI,
    refetchInterval: 60000, // 1分ごとに更新
  })
}
