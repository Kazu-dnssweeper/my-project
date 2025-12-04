'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getBoms, getBom, getBomsByParentItem, createBom, updateBom, deleteBom } from '../api'
import type { BomFormData, BomUpdateData } from '../types'

export function useBoms() {
  return useQuery({
    queryKey: ['bom'],
    queryFn: getBoms,
  })
}

export function useBom(id: string) {
  return useQuery({
    queryKey: ['bom', id],
    queryFn: () => getBom(id),
    enabled: !!id,
  })
}

export function useBomsByParentItem(parentItemId: string) {
  return useQuery({
    queryKey: ['bom', 'parent', parentItemId],
    queryFn: () => getBomsByParentItem(parentItemId),
    enabled: !!parentItemId,
  })
}

export function useCreateBom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: BomFormData) => createBom(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bom'] })
    },
  })
}

export function useUpdateBom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: BomUpdateData }) =>
      updateBom(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['bom'] })
      queryClient.invalidateQueries({ queryKey: ['bom', id] })
    },
  })
}

export function useDeleteBom() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteBom(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bom'] })
    },
  })
}
