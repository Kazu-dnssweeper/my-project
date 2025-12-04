'use client'

import Link from 'next/link'
import { Package, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserMenu, useAuth } from '@/features/auth'
import { AlertDropdown } from '@/features/alerts'

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="flex h-14 items-center gap-4 px-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Link href="/dashboard" className="flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg hidden sm:inline-block">PartStock</span>
        </Link>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <AlertDropdown />
          {user && <UserMenu user={user} />}
        </div>
      </div>
    </header>
  )
}
