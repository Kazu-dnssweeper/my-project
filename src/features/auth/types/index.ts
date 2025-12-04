import type { User } from '@/types'

export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  companyName: string
  name: string
  email: string
  password: string
  confirmPassword: string
}

export interface AuthUser extends User {
  tenant_name?: string
}

export interface AuthError {
  message: string
  code?: string
}
