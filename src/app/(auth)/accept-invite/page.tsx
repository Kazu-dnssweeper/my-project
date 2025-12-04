'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { AcceptInviteForm, InvalidInvitation } from '@/features/auth/components/AcceptInviteForm'
import { useInvitationByToken } from '@/features/auth/hooks/useInvite'

function AcceptInviteContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const { data: invitation, isLoading, error } = useInvitationByToken(token)

  if (isLoading) {
    return (
      <div className="w-full max-w-md space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (error || !invitation) {
    return <InvalidInvitation />
  }

  return <AcceptInviteForm invitation={invitation} />
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  )
}
