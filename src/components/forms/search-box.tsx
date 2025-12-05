'use client'

import * as React from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/use-debounce'

interface SearchBoxProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  debounceMs?: number
  className?: string
}

export function SearchBox({
  value: controlledValue,
  onChange,
  placeholder = '検索...',
  debounceMs = 300,
  className,
}: SearchBoxProps) {
  const [internalValue, setInternalValue] = React.useState(controlledValue ?? '')
  const debouncedValue = useDebounce(internalValue, debounceMs)

  // Sync controlled value
  React.useEffect(() => {
    if (controlledValue !== undefined && controlledValue !== internalValue) {
      setInternalValue(controlledValue)
    }
  }, [controlledValue])

  // Call onChange when debounced value changes
  React.useEffect(() => {
    onChange(debouncedValue)
  }, [debouncedValue, onChange])

  const handleClear = () => {
    setInternalValue('')
    onChange('')
  }

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        value={internalValue}
        onChange={(e) => setInternalValue(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-9"
      />
      {internalValue && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
          onClick={handleClear}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">クリア</span>
        </Button>
      )}
    </div>
  )
}
