import type { User, UserRole } from '@/types'

// Re-export UserRole from types
export type { UserRole }

// ログインフォームデータ
export interface LoginFormData {
  email: string
  password: string
}

// 登録フォームデータ
export interface RegisterFormData {
  companyName?: string
  name: string
  email: string
  password: string
  confirmPassword: string
  agreeToTerms?: boolean
}

// 認証済みユーザー（拡張）
export interface AuthUser extends User {
  tenant_name?: string
}

// 認証エラー
export interface AuthError {
  message: string
  code?: string
}

// 招待データ
export interface Invitation {
  id: string
  tenant_id: string
  email: string
  role: UserRole
  invited_by: string | null
  token: string
  expires_at: string
  accepted_at: string | null
  created_at: string
}

// 招待作成データ
export interface InviteFormData {
  email: string
  role: UserRole
}

// 招待承認データ
export interface AcceptInviteFormData {
  name: string
  password: string
  confirmPassword: string
}

// オンボーディングデータ
export interface OnboardingFormData {
  companyName: string
  userName?: string
}

// パスワードリセットデータ
export interface ForgotPasswordFormData {
  email: string
}

// パスワードリセット（新パスワード設定）データ
export interface ResetPasswordFormData {
  password: string
  confirmPassword: string
}
