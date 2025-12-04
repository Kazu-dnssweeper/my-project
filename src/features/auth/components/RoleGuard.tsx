'use client'

import { useAuth } from '../hooks/useAuth'
import type { UserRole } from '../types'

interface RoleGuardProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
  fallback?: React.ReactNode
}

/**
 * 権限ガードコンポーネント
 * 指定された権限を持つユーザーのみ children を表示
 */
export function RoleGuard({
  children,
  allowedRoles,
  fallback,
}: RoleGuardProps) {
  const { user, isLoading } = useAuth()

  // 読み込み中
  if (isLoading) {
    return null
  }

  // ユーザーがいない場合
  if (!user) {
    return fallback || null
  }

  // ユーザーの権限をチェック
  const userRole = (user as { role?: UserRole }).role || 'viewer'

  if (!allowedRoles.includes(userRole)) {
    // 権限なしの場合
    return (
      fallback || (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-destructive text-lg font-semibold">
            アクセス権限がありません
          </div>
          <p className="text-muted-foreground mt-2">
            この機能を使用するには、管理者に権限を付与してもらってください。
          </p>
        </div>
      )
    )
  }

  return <>{children}</>
}

/**
 * 管理者のみ表示するラッパー
 */
export function AdminOnly({
  children,
  fallback,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  return (
    <RoleGuard allowedRoles={['admin']} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}

/**
 * 編集者以上のみ表示するラッパー
 */
export function EditorOrAbove({
  children,
  fallback,
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  return (
    <RoleGuard allowedRoles={['admin', 'editor']} fallback={fallback}>
      {children}
    </RoleGuard>
  )
}
