'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { login } from '../api'
import type { LoginFormData } from '../types'

export function useLogin() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: LoginFormData) => login(data),
    onSuccess: (user) => {
      queryClient.setQueryData(['auth', 'user'], user)
      router.push('/dashboard')
    },
  })
}
