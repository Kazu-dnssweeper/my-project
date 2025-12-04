'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { UserPlus, CheckCircle, Copy, Mail } from 'lucide-react'
import { useCreateInvitation } from '../hooks/useInvite'
import { generateInviteUrl } from '../api/invite'
import { getRoleDisplayName, getRoleDescription } from '../lib/permissions'
import type { UserRole } from '../types'

const inviteSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  role: z.enum(['editor', 'viewer']),
})

type InviteFormValues = z.infer<typeof inviteSchema>

interface InviteUserDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
  trigger?: React.ReactNode
}

export function InviteUserDialog({
  open: controlledOpen,
  onOpenChange,
  onSuccess,
  trigger,
}: InviteUserDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen

  const { mutate: createInvitation, isPending, error } = useCreateInvitation()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      role: 'viewer',
    },
  })

  const selectedRole = watch('role')

  const handleClose = () => {
    setOpen(false)
    reset()
    setInviteUrl(null)
    setCopied(false)
  }

  const onSubmit = (data: InviteFormValues) => {
    createInvitation(data, {
      onSuccess: (invitation) => {
        const url = generateInviteUrl(invitation.token)
        setInviteUrl(url)
        onSuccess?.()
      },
    })
  }

  const handleCopyUrl = async () => {
    if (inviteUrl) {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            ユーザーを招待
          </DialogTitle>
          <DialogDescription>
            メールアドレスと権限を指定してユーザーを招待します
          </DialogDescription>
        </DialogHeader>

        {inviteUrl ? (
          // 招待完了画面
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                <CheckCircle className="h-6 w-6" />
              </div>
            </div>
            <div className="text-center">
              <p className="font-medium">招待を作成しました</p>
              <p className="text-sm text-muted-foreground mt-1">
                以下のURLを招待したい方に共有してください
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Input value={inviteUrl} readOnly className="text-sm" />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopyUrl}
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>招待リンクの有効期限は7日間です</span>
            </div>
          </div>
        ) : (
          // 招待フォーム
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4 py-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {error instanceof Error ? error.message : '招待の作成に失敗しました'}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">メールアドレス</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="example@company.com"
                  {...register('email')}
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">権限</Label>
                <Select
                  value={selectedRole}
                  onValueChange={(value) => setValue('role', value as 'editor' | 'viewer')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="権限を選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="editor">
                      <div className="flex flex-col">
                        <span>{getRoleDisplayName('editor')}</span>
                        <span className="text-xs text-muted-foreground">
                          {getRoleDescription('editor')}
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="viewer">
                      <div className="flex flex-col">
                        <span>{getRoleDisplayName('viewer')}</span>
                        <span className="text-xs text-muted-foreground">
                          {getRoleDescription('viewer')}
                        </span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-sm text-destructive">{errors.role.message}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                キャンセル
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Spinner size="sm" className="mr-2" />}
                招待を送信
              </Button>
            </DialogFooter>
          </form>
        )}

        {inviteUrl && (
          <DialogFooter>
            <Button onClick={handleClose}>閉じる</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
