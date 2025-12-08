import { createClient } from '@/lib/supabase/client'
import type { LoginFormData, RegisterFormData, AuthUser } from '../types'

const supabase = createClient()

export async function login(data: LoginFormData): Promise<AuthUser> {
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })

  if (error) {
    throw new Error(error.message)
  }

  if (!authData.user) {
    throw new Error('ログインに失敗しました')
  }

  // ユーザー情報を取得
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*, tenants(name)')
    .eq('id', authData.user.id)
    .single()

  if (userError) {
    throw new Error('ユーザー情報の取得に失敗しました')
  }

  return {
    ...userData,
    tenant_name: userData.tenants?.name,
  } as AuthUser
}

export async function register(data: RegisterFormData): Promise<AuthUser> {
  // 1. API経由でユーザー登録（Service Roleを使用してRLSをバイパス）
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: data.email,
      password: data.password,
      name: data.name,
      companyName: data.companyName,
    }),
  })

  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.error || 'ユーザー登録に失敗しました')
  }

  // 2. 登録後にログインしてセッションを確立
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })

  if (loginError) {
    throw new Error('ログインに失敗しました。登録は完了しています。')
  }

  return result.user as AuthUser
}

export async function logout(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) {
    throw new Error(error.message)
  }
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: userData, error } = await supabase
    .from('users')
    .select('*, tenants(name)')
    .eq('id', user.id)
    .single()

  if (error || !userData) {
    return null
  }

  return {
    ...userData,
    tenant_name: userData.tenants?.name,
  } as AuthUser
}

export async function onAuthStateChange(
  callback: (user: AuthUser | null) => void
) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT' || !session?.user) {
      callback(null)
      return
    }

    const user = await getCurrentUser()
    callback(user)
  })
}
