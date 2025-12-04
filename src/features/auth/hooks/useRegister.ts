'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { register } from '../api'
import type { RegisterFormData } from '../types'

export function useRegister() {
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: RegisterFormData) => register(data),
    onSuccess: (user) => {
      queryClient.setQueryData(['auth', 'user'], user)
      router.push('/dashboard')
    },
  })
}
