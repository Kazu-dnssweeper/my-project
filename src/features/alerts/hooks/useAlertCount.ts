'use client'

import { useQuery } from '@tanstack/react-query'
import { getAlertCount } from '../api'

export function useAlertCount() {
  return useQuery({
    queryKey: ['alerts', 'count'],
    queryFn: getAlertCount,
    refetchInterval: 60000, // 1分ごとに更新
  })
}
