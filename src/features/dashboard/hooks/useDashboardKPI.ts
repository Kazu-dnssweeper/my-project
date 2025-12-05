'use client'

import { useQuery } from '@tanstack/react-query'
import { getDashboardKPI } from '../api'
import type { DashboardKPI } from '../types'

export function useDashboardKPI() {
  return useQuery<DashboardKPI>({
    queryKey: ['dashboard', 'kpi'],
    queryFn: () => getDashboardKPI(),
    refetchInterval: 60000, // 1分ごとに更新
  })
}
