'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getItems, getItem, getItemInventories, createItem, updateItem, deleteItem, getCategories, getWarehouses } from '../api'
import type { ItemFilters, CreateItemData } from '../types'

export function useItems(
  filters?: ItemFilters,
  page = 1,
  limit = 20,
  sortBy = 'item_code',
  sortOrder: 'asc' | 'desc' = 'asc'
) {
  return useQuery({
    queryKey: ['items', filters, page, limit, sortBy, sortOrder],
    queryFn: () => getItems(filters, page, limit, sortBy, sortOrder),
  })
}

export function useItem(id: string) {
  return useQuery({
    queryKey: ['item', id],
    queryFn: () => getItem(id),
    enabled: !!id,
  })
}

export function useItemInventories(itemId: string) {
  return useQuery({
    queryKey: ['item-inventories', itemId],
    queryFn: () => getItemInventories(itemId),
    enabled: !!itemId,
  })
}

export function useCreateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateItemData) => createItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })
}

export function useUpdateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateItemData> }) =>
      updateItem(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
      queryClient.invalidateQueries({ queryKey: ['item', variables.id] })
    },
  })
}

export function useDeleteItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })
}

export function useWarehouses() {
  return useQuery({
    queryKey: ['warehouses'],
    queryFn: getWarehouses,
  })
}
