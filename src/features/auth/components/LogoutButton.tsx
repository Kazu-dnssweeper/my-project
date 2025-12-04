'use client'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { LogOut } from 'lucide-react'
import { useLogout } from '../hooks/useLogout'

interface LogoutButtonProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  showIcon?: boolean
  className?: string
}

export function LogoutButton({
  variant = 'ghost',
  showIcon = true,
  className,
}: LogoutButtonProps) {
  const { mutate: logout, isPending } = useLogout()

  return (
    <Button
      variant={variant}
      onClick={() => logout()}
      disabled={isPending}
      className={className}
    >
      {isPending ? (
        <Spinner size="sm" className="mr-2" />
      ) : showIcon ? (
        <LogOut className="mr-2 h-4 w-4" />
      ) : null}
      ログアウト
    </Button>
  )
}
