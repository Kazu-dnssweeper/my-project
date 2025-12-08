import { createClient } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'
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
  // 注: handle_new_user トリガーがテナントとユーザーを自動作成する
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        name: data.name,
        full_name: data.name,
      },
    },
  })

  if (authError) {
    throw new Error(authError.message)
  }

  if (!authData.user) {
    throw new Error('ユーザー登録に失敗しました')
  }

  // 2. トリガーが作成したユーザー情報を取得
  // 少し待ってからリトライ（トリガー完了を待つ）
  let userData = null
  let retries = 3
  while (retries > 0 && !userData) {
    const { data: fetchedUser, error: userError } = await supabase
      .from('users')
      .select('*, tenants(id, name)')
      .eq('id', authData.user.id)
      .single()

    if (!userError && fetchedUser) {
      userData = fetchedUser
      break
    }

    retries--
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  if (!userData) {
    throw new Error('ユーザー情報の取得に失敗しました')
  }

  // 3. 会社名が指定されている場合、テナント名を更新
  if (data.companyName && userData.tenant_id) {
    const { error: tenantError } = await supabase
      .from('tenants')
      .update({ name: data.companyName })
      .eq('id', userData.tenant_id)

    if (tenantError) {
      // テナント名の更新失敗は致命的ではないのでログのみ
      logger.warn('テナント名の更新に失敗しました', { error: tenantError })
    }
  }

  return {
    ...userData,
    tenant_name: data.companyName || userData.tenants?.name,
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
