'use client'

import { useQuery } from '@tanstack/react-query'
import { getLots, getLot, getLotsForItem, getFifoSuggestions } from '../api'

export function useLots() {
  return useQuery({
    queryKey: ['lots'],
    queryFn: getLots,
  })
}

export function useLot(id: string) {
  return useQuery({
    queryKey: ['lots', id],
    queryFn: () => getLot(id),
    enabled: !!id,
  })
}

export function useLotsForItem(itemId: string) {
  return useQuery({
    queryKey: ['lots', 'item', itemId],
    queryFn: () => getLotsForItem(itemId),
    enabled: !!itemId,
  })
}

export function useFifoSuggestions(itemId: string, quantity: number) {
  return useQuery({
    queryKey: ['lots', 'fifo', itemId, quantity],
    queryFn: () => getFifoSuggestions(itemId, quantity),
    enabled: !!itemId && quantity > 0,
  })
}
