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
  // 1. Supabase Authでユーザー作成
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        name: data.name,
      },
    },
  })

  if (authError) {
    throw new Error(authError.message)
  }

  if (!authData.user) {
    throw new Error('ユーザー登録に失敗しました')
  }

  // 2. テナント作成
  const { data: tenantData, error: tenantError } = await supabase
    .from('tenants')
    .insert({ name: data.companyName })
    .select()
    .single()

  if (tenantError) {
    throw new Error('会社情報の登録に失敗しました')
  }

  // 3. ユーザー情報をusersテーブルに保存
  const { data: userData, error: userError } = await supabase
    .from('users')
    .insert({
      id: authData.user.id,
      tenant_id: tenantData.id,
      email: data.email,
      name: data.name,
      role: 'admin',
    })
    .select()
    .single()

  if (userError) {
    throw new Error('ユーザー情報の保存に失敗しました')
  }

  return {
    ...userData,
    tenant_name: data.companyName,
  } as AuthUser
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
