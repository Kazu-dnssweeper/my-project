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
import { useLogin } from '../hooks/useLogin'
import { GoogleLoginButton } from './GoogleLoginButton'
import type { LoginFormData } from '../types'

const loginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(6, 'パスワードは6文字以上で入力してください'),
})

interface LoginFormProps {
  onSuccess?: () => void
  onError?: (error: Error) => void
}

export function LoginForm({ onSuccess, onError }: LoginFormProps) {
  const { mutate: login, isPending, error } = useLogin()
  const [googleError, setGoogleError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = (data: LoginFormData) => {
    login(data, {
      onSuccess: () => onSuccess?.(),
      onError: (err) => onError?.(err as Error),
    })
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">ログイン</CardTitle>
        <CardDescription className="text-center">
          PartStockにログインしてください
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

          {/* Google ログインボタン */}
          <GoogleLoginButton
            mode="login"
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

          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              {...register('email')}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">パスワード</Label>
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                パスワードを忘れた方
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              aria-invalid={!!errors.password}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending && <Spinner size="sm" className="mr-2" />}
            ログイン
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            アカウントをお持ちでない方は{' '}
            <Link href="/register" className="text-primary hover:underline">
              新規登録
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
