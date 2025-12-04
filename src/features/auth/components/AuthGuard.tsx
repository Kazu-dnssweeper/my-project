'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '../hooks/useAuth'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isLoading, isAuthenticated, router])

  if (isLoading) {
    return (
      fallback || (
        <div className="flex h-screen items-center justify-center">
          <div className="space-y-4 w-full max-w-md p-8">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-8 w-1/2" />
          </div>
        </div>
      )
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return <>{children}</>
}
