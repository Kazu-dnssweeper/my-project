import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  companyName: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = registerSchema.parse(body)

    // Service Role Key を使用してRLSをバイパス
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // 1. Supabase Authでユーザー作成
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        name: data.name,
        full_name: data.name,
      },
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'ユーザー登録に失敗しました' },
        { status: 400 }
      )
    }

    // 2. トリガーが作成したユーザー情報を取得（Service Roleなので RLS をバイパス）
    let userData = null
    let retries = 5
    while (retries > 0 && !userData) {
      const { data: fetchedUser, error: userError } = await supabaseAdmin
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
        await new Promise(resolve => setTimeout(resolve, 300))
      }
    }

    if (!userData) {
      return NextResponse.json(
        { error: 'ユーザー情報の取得に失敗しました' },
        { status: 500 }
      )
    }

    // 3. 会社名が指定されている場合、テナント名を更新
    if (data.companyName && userData.tenant_id) {
      await supabaseAdmin
        .from('tenants')
        .update({ name: data.companyName })
        .eq('id', userData.tenant_id)
    }

    return NextResponse.json({
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        tenant_id: userData.tenant_id,
        tenant_name: data.companyName || userData.tenants?.name,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '入力データが不正です', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '登録処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}
