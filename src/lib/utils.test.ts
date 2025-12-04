import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn (className utility)', () => {
  it('should merge single class name', () => {
    expect(cn('text-red-500')).toBe('text-red-500')
  })

  it('should merge multiple class names', () => {
    expect(cn('text-red-500', 'bg-blue-500')).toBe('text-red-500 bg-blue-500')
  })

  it('should handle conditional classes', () => {
    const isActive = true
    const isDisabled = false
    expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe(
      'base active'
    )
  })

  it('should merge Tailwind classes correctly', () => {
    // Later class should override earlier conflicting class
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })

  it('should handle array of classes', () => {
    expect(cn(['text-sm', 'font-bold'])).toBe('text-sm font-bold')
  })

  it('should handle undefined and null values', () => {
    expect(cn('base', undefined, null, 'end')).toBe('base end')
  })

  it('should handle empty string', () => {
    expect(cn('')).toBe('')
    expect(cn('', 'text-red-500')).toBe('text-red-500')
  })

  it('should deduplicate identical classes', () => {
    expect(cn('text-red-500', 'text-red-500')).toBe('text-red-500')
  })

  it('should handle object syntax', () => {
    expect(cn({ 'text-red-500': true, 'text-blue-500': false })).toBe(
      'text-red-500'
    )
  })
})
