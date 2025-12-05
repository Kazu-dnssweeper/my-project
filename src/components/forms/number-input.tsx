'use client'

import * as React from 'react'
import { Minus, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  className?: string
  id?: string
  name?: string
}

export function NumberInput({
  value,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  disabled = false,
  className,
  id,
  name,
}: NumberInputProps) {
  const handleIncrement = () => {
    const newValue = Math.min(value + step, max)
    onChange(newValue)
  }

  const handleDecrement = () => {
    const newValue = Math.max(value - step, min)
    onChange(newValue)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    if (inputValue === '') {
      onChange(min)
      return
    }
    const numValue = parseFloat(inputValue)
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(min, Math.min(numValue, max))
      onChange(clampedValue)
    }
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9 shrink-0"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
      >
        <Minus className="h-4 w-4" />
        <span className="sr-only">減らす</span>
      </Button>
      <Input
        type="number"
        id={id}
        name={name}
        value={value}
        onChange={handleChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="text-center [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-9 w-9 shrink-0"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
      >
        <Plus className="h-4 w-4" />
        <span className="sr-only">増やす</span>
      </Button>
    </div>
  )
}
