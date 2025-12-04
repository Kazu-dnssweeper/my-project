'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getTransactions,
  getItemTransactions,
  createTransaction,
  getInventoriesForTransaction,
} from '../api'
import type { TransactionFilters, CreateTransactionData } from '../types'

export function useTransactions(
  filters?: TransactionFilters,
  page = 1,
  limit = 20
) {
  return useQuery({
    queryKey: ['transactions', filters, page, limit],
    queryFn: () => getTransactions(filters, page, limit),
  })
}

export function useItemTransactions(itemId: string, limit = 10) {
  return useQuery({
    queryKey: ['item-transactions', itemId, limit],
    queryFn: () => getItemTransactions(itemId, limit),
    enabled: !!itemId,
  })
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateTransactionData) => createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['item-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.invalidateQueries({ queryKey: ['item-inventories'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })
}

export function useInventoriesForTransaction(itemId?: string) {
  return useQuery({
    queryKey: ['inventories-for-transaction', itemId],
    queryFn: () => getInventoriesForTransaction(itemId),
  })
}
