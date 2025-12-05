'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { useDebounce } from '@/hooks/use-debounce'

interface ComboBoxOption {
  value: string
  label: string
}

interface ComboBoxProps {
  value: string
  onChange: (value: string) => void
  options?: ComboBoxOption[]
  onSearch?: (query: string) => Promise<ComboBoxOption[]>
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
}

export function ComboBox({
  value,
  onChange,
  options: staticOptions,
  onSearch,
  placeholder = '選択してください',
  searchPlaceholder = '検索...',
  emptyMessage = '該当なし',
  disabled,
  className,
}: ComboBoxProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState('')
  const [options, setOptions] = React.useState<ComboBoxOption[]>(staticOptions ?? [])
  const [isLoading, setIsLoading] = React.useState(false)

  const debouncedQuery = useDebounce(query, 300)

  // Async search
  React.useEffect(() => {
    if (!onSearch) {
      // Filter static options
      if (staticOptions) {
        const filtered = staticOptions.filter((option) =>
          option.label.toLowerCase().includes(query.toLowerCase())
        )
        setOptions(filtered)
      }
      return
    }

    const fetchOptions = async () => {
      setIsLoading(true)
      try {
        const results = await onSearch(debouncedQuery)
        setOptions(results)
      } catch (error) {
        console.error('ComboBox search error:', error)
        setOptions([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchOptions()
  }, [debouncedQuery, onSearch, staticOptions, query])

  // Reset options when opening
  React.useEffect(() => {
    if (open && staticOptions) {
      setOptions(staticOptions)
      setQuery('')
    }
  }, [open, staticOptions])

  const selectedOption = (staticOptions ?? options).find((o) => o.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          {selectedOption?.label ?? placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="p-2 border-b">
          <Input
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-8"
          />
        </div>
        <div className="max-h-60 overflow-y-auto p-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : options.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          ) : (
            options.map((option) => (
              <button
                key={option.value}
                type="button"
                className={cn(
                  'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                  value === option.value && 'bg-accent'
                )}
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
              >
                <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                  {value === option.value && <Check className="h-4 w-4" />}
                </span>
                {option.label}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
