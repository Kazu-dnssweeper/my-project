import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let supabaseInstance: SupabaseClient | null = null

/**
 * シングルトンパターンでSupabaseクライアントを取得
 * ブラウザ環境でのみ使用
 */
export function createClient(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance
  }

  supabaseInstance = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  return supabaseInstance
}

/**
 * 直接エクスポートされたシングルトンインスタンス
 * 簡潔な使用のため
 */
export const supabase = createClient()
