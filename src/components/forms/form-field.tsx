'use client'

import * as React from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface FormFieldProps {
  label: string
  name: string
  error?: string
  required?: boolean
  helpText?: string
  children: React.ReactNode
  className?: string
}

export function FormField({
  label,
  name,
  error,
  required,
  helpText,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={name} className={cn(error && 'text-destructive')}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
      {helpText && !error && (
        <p className="text-sm text-muted-foreground">{helpText}</p>
      )}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
