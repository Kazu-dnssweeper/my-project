'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createInvitation,
  getInvitations,
  getInvitationByToken,
  deleteInvitation,
  resendInvitation,
} from '../api/invite'
import type { InviteFormData } from '../types'

/**
 * 招待一覧を取得するフック
 */
export function useInvitations() {
  return useQuery({
    queryKey: ['invitations'],
    queryFn: getInvitations,
  })
}

/**
 * 招待をトークンで取得するフック
 */
export function useInvitationByToken(token: string | null) {
  return useQuery({
    queryKey: ['invitation', token],
    queryFn: () => (token ? getInvitationByToken(token) : null),
    enabled: !!token,
  })
}

/**
 * 招待を作成するフック
 */
export function useCreateInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: InviteFormData) => createInvitation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] })
    },
  })
}

/**
 * 招待を削除するフック
 */
export function useDeleteInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] })
    },
  })
}

/**
 * 招待を再送信するフック
 */
export function useResendInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => resendInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] })
    },
  })
}
