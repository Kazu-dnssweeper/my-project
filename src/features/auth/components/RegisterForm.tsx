'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { Separator } from '@/components/ui/separator'
import { AlertCircle } from 'lucide-react'
import { useRegister } from '../hooks/useRegister'
import { GoogleLoginButton } from './GoogleLoginButton'
import type { RegisterFormData } from '../types'

const registerSchema = z.object({
  companyName: z.string().min(1, '会社名を入力してください').optional(),
  name: z.string().min(1, '名前を入力してください'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
  confirmPassword: z.string().min(8, 'パスワード（確認）を入力してください'),
  agreeToTerms: z.boolean().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'パスワードが一致しません',
  path: ['confirmPassword'],
})

interface RegisterFormProps {
  onSuccess?: () => void
  onError?: (error: Error) => void
  invitationToken?: string
}

export function RegisterForm({ onSuccess, onError, invitationToken }: RegisterFormProps) {
  const { mutate: register, isPending, error } = useRegister()
  const [googleError, setGoogleError] = useState<string | null>(null)

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = (data: RegisterFormData) => {
    register(data, {
      onSuccess: () => onSuccess?.(),
      onError: (err) => onError?.(err as Error),
    })
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">新規登録</CardTitle>
        <CardDescription className="text-center">
          PartStockに新規アカウントを作成します
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {(error || googleError) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error?.message || googleError}</AlertDescription>
            </Alert>
          )}

          {/* Google 登録ボタン */}
          {!invitationToken && (
            <>
              <GoogleLoginButton
                mode="register"
                onError={(err) => setGoogleError(err.message)}
                className="w-full"
              />

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    または
                  </span>
                </div>
              </div>
            </>
          )}

          {!invitationToken && (
            <div className="space-y-2">
              <Label htmlFor="companyName">会社名</Label>
              <Input
                id="companyName"
                placeholder="株式会社サンプル"
                {...formRegister('companyName')}
                aria-invalid={!!errors.companyName}
              />
              {errors.companyName && (
                <p className="text-sm text-destructive">{errors.companyName.message}</p>
              )}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">名前</Label>
            <Input
              id="name"
              placeholder="山田 太郎"
              {...formRegister('name')}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              {...formRegister('email')}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              type="password"
              placeholder="8文字以上"
              {...formRegister('password')}
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">パスワード（確認）</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="再度入力してください"
              {...formRegister('confirmPassword')}
              aria-invalid={!!errors.confirmPassword}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Spinner size="sm" className="mr-2" />}
            アカウント作成
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            既にアカウントをお持ちの方は{' '}
            <Link href="/login" className="text-primary hover:underline">
              ログイン
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
