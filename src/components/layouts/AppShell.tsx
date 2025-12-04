'use client'

import { useState } from 'react'
import { Header } from './Header'
import { SideNav } from './SideNav'
import { AuthGuard } from '@/features/auth'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [sideNavOpen, setSideNavOpen] = useState(false)

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <Header onMenuClick={() => setSideNavOpen(true)} />
        <SideNav isOpen={sideNavOpen} onClose={() => setSideNavOpen(false)} />
        <main className="md:pl-64 pt-0">
          <div className="container mx-auto p-6">{children}</div>
        </main>
      </div>
    </AuthGuard>
  )
}
