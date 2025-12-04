// 権限管理ユーティリティ

import type { UserRole } from '@/types'

export const permissions = {
  admin: ['read', 'create', 'update', 'delete', 'manage_users', 'settings'],
  editor: ['read', 'create', 'update', 'delete'],
  viewer: ['read'],
} as const

export type Permission =
  | 'read'
  | 'create'
  | 'update'
  | 'delete'
  | 'manage_users'
  | 'settings'

/**
 * 作成権限があるかチェック
 */
export function canCreate(role: UserRole): boolean {
  return role === 'admin' || role === 'editor'
}

/**
 * 更新権限があるかチェック
 */
export function canUpdate(role: UserRole): boolean {
  return role === 'admin' || role === 'editor'
}

/**
 * 削除権限があるかチェック
 */
export function canDelete(role: UserRole): boolean {
  return role === 'admin' || role === 'editor'
}

/**
 * ユーザー管理権限があるかチェック
 */
export function canManageUsers(role: UserRole): boolean {
  return role === 'admin'
}

/**
 * 設定ページへのアクセス権限があるかチェック
 */
export function canAccessSettings(role: UserRole): boolean {
  return role === 'admin'
}

/**
 * 特定の権限を持っているかチェック
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const rolePermissions = permissions[role] as readonly string[]
  return rolePermissions.includes(permission)
}

/**
 * 指定された権限レベル以上かチェック
 */
export function isRoleAtLeast(
  userRole: UserRole,
  requiredRole: UserRole
): boolean {
  const roleOrder = ['viewer', 'editor', 'admin'] as const
  const userIndex = roleOrder.indexOf(userRole)
  const requiredIndex = roleOrder.indexOf(requiredRole)
  return userIndex >= requiredIndex
}

/**
 * 権限の表示名を取得
 */
export function getRoleDisplayName(role: UserRole): string {
  const names = {
    admin: '管理者',
    editor: '編集者',
    viewer: '閲覧者',
  } as const
  return names[role]
}

/**
 * 権限の説明を取得
 */
export function getRoleDescription(role: UserRole): string {
  const descriptions = {
    admin: '全機能 + ユーザー管理 + 設定変更',
    editor: 'データの閲覧・作成・編集・削除',
    viewer: 'データの閲覧のみ',
  } as const
  return descriptions[role]
}
