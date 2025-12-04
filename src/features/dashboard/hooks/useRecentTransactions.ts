'use client'

import { useQuery } from '@tanstack/react-query'
import { getRecentTransactions } from '../api'

export function useRecentTransactions(limit = 5) {
  return useQuery({
    queryKey: ['dashboard', 'recent-transactions', limit],
    queryFn: () => getRecentTransactions(limit),
    refetchInterval: 30000, // 30秒ごとに更新
  })
}
