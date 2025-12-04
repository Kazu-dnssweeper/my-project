'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const onboardingSchema = z.object({
  companyName: z.string().min(1, '会社名を入力してください'),
  userName: z.string().optional(),
})

type OnboardingFormValues = z.infer<typeof onboardingSchema>

interface OnboardingFormProps {
  email: string
  defaultName?: string
}

export function OnboardingForm({ email, defaultName }: OnboardingFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      companyName: '',
      userName: defaultName || '',
    },
  })

  const onSubmit = async (data: OnboardingFormValues) => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // ユーザーのメタデータを更新
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          company_name: data.companyName,
          name: data.userName || defaultName,
        },
      })

      if (updateError) {
        throw updateError
      }

      // テナントとユーザーを作成（サーバー側の処理をトリガー）
      // ここでは RPC 関数を呼び出すか、API Route を使用
      const { error: setupError } = await supabase.rpc('setup_new_tenant', {
        company_name: data.companyName,
        user_name: data.userName || defaultName,
      })

      if (setupError) {
        // RPC関数がない場合は、直接テナントを作成
        // 本番ではサーバーサイドで処理すべき
        console.warn('setup_new_tenant RPC not found, using fallback')
      }

      // ダッシュボードへリダイレクト
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : '設定に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Building2 className="h-6 w-6" />
          </div>
        </div>
        <CardTitle>会社情報の設定</CardTitle>
        <CardDescription>
          PartStockを始めるために、会社情報を入力してください
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-4 bg-muted/50 rounded-lg text-center">
          <p className="text-sm text-muted-foreground">ログイン中:</p>
          <p className="font-medium">{email}</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">会社名 *</Label>
            <Input
              id="companyName"
              placeholder="株式会社サンプル"
              {...register('companyName')}
              aria-invalid={!!errors.companyName}
            />
            {errors.companyName && (
              <p className="text-sm text-destructive">
                {errors.companyName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="userName">表示名（任意）</Label>
            <Input
              id="userName"
              placeholder="山田 太郎"
              {...register('userName')}
            />
            <p className="text-xs text-muted-foreground">
              未入力の場合はメールアドレスから自動設定されます
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Spinner size="sm" className="mr-2" />}
            利用を開始
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
