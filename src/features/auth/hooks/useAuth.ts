'use client'

import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth'
import { getCurrentUser, onAuthStateChange } from '../api'
import type { AuthUser } from '../types'

export function useAuth() {
  const queryClient = useQueryClient()
  const { setUser, setIsLoading } = useAuthStore()

  const { data: user, isLoading, error } = useQuery<AuthUser | null>({
    queryKey: ['auth', 'user'],
    queryFn: getCurrentUser,
    staleTime: 5 * 60 * 1000, // 5分
  })

  useEffect(() => {
    setUser(user ?? null)
    setIsLoading(isLoading)
  }, [user, isLoading, setUser, setIsLoading])

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null

    onAuthStateChange((newUser) => {
      queryClient.setQueryData(['auth', 'user'], newUser)
    }).then(({ data }) => {
      subscription = data.subscription
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [queryClient])

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
    error,
  }
}
