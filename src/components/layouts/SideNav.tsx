'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  GitBranch,
  Boxes,
  ScanBarcode,
  FileSpreadsheet,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SideNavProps {
  isOpen?: boolean
  onClose?: () => void
}

const navItems = [
  { href: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/inventory', label: '在庫管理', icon: Package },
  { href: '/transactions', label: '入出庫', icon: ArrowLeftRight },
  { href: '/bom', label: 'BOM', icon: GitBranch },
  { href: '/lots', label: 'ロット', icon: Boxes },
  { href: '/scan', label: 'スキャン', icon: ScanBarcode },
  { href: '/import-export', label: 'CSV入出力', icon: FileSpreadsheet },
]

export function SideNav({ isOpen, onClose }: SideNavProps) {
  const pathname = usePathname()

  return (
    <>
      {/* モバイル用オーバーレイ */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}
      {/* サイドナビゲーション */}
      <aside
        className={cn(
          'fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)] w-64 border-r bg-background transition-transform duration-200 md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between p-4 md:hidden">
            <span className="font-semibold">メニュー</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>
    </>
  )
}
