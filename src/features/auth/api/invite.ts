import { createClient } from '@/lib/supabase/client'
import type { Invitation, InviteFormData, UserRole } from '../types'

const supabase = createClient()

/**
 * 招待を作成する
 */
export async function createInvitation(
  data: InviteFormData
): Promise<Invitation> {
  // トークン生成（UUIDを使用）
  const token = crypto.randomUUID()

  // 有効期限（7日後）
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const { data: invitation, error } = await supabase
    .from('invitations')
    .insert({
      email: data.email,
      role: data.role,
      token,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('このメールアドレスは既に招待済みです')
    }
    throw new Error(error.message)
  }

  return invitation as Invitation
}

/**
 * 招待一覧を取得する
 */
export async function getInvitations(): Promise<Invitation[]> {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data as Invitation[]
}

/**
 * 招待をトークンで取得する
 */
export async function getInvitationByToken(
  token: string
): Promise<Invitation | null> {
  const { data, error } = await supabase
    .from('invitations')
    .select('*')
    .eq('token', token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // 見つからない
    }
    throw new Error(error.message)
  }

  return data as Invitation
}

/**
 * 招待を削除する
 */
export async function deleteInvitation(id: string): Promise<void> {
  const { error } = await supabase.from('invitations').delete().eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}

/**
 * 招待を再送信する（新しいトークンを生成）
 */
export async function resendInvitation(id: string): Promise<Invitation> {
  const token = crypto.randomUUID()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const { data, error } = await supabase
    .from('invitations')
    .update({
      token,
      expires_at: expiresAt.toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as Invitation
}

/**
 * 招待メールのURLを生成する
 */
export function generateInviteUrl(token: string): string {
  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  return `${baseUrl}/accept-invite?token=${token}`
}
