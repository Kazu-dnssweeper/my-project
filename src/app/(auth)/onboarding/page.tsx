'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Skeleton } from '@/components/ui/skeleton'
import { OnboardingForm } from '@/features/auth/components/OnboardingForm'
import { createClient } from '@/lib/supabase/client'

export default function OnboardingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [email, setEmail] = useState<string | null>(null)
  const [name, setName] = useState<string | undefined>(undefined)

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // 未認証の場合はログインページへ
        router.push('/login')
        return
      }

      // 既にテナントに属している場合はダッシュボードへ
      const { data: profile } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single()

      if (profile?.tenant_id) {
        router.push('/dashboard')
        return
      }

      setEmail(user.email || null)
      setName(user.user_metadata?.name || user.user_metadata?.full_name)
      setIsLoading(false)
    }

    checkUser()
  }, [router])

  if (isLoading) {
    return (
      <div className="w-full max-w-md space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (!email) {
    return null
  }

  return <OnboardingForm email={email} defaultName={name} />
}
