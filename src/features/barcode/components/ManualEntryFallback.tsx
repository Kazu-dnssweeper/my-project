'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { Keyboard, Search } from 'lucide-react'
import { findItemByCode } from '../api'
import { ScanResultDialog } from './ScanResultDialog'
import type { ScanResult } from '../types'

interface ManualEntryFallbackProps {
  onResult?: (result: ScanResult) => void
}

export function ManualEntryFallback({ onResult }: ManualEntryFallbackProps) {
  const [code, setCode] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [result, setResult] = useState<ScanResult | null>(null)
  const [resultOpen, setResultOpen] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return

    setIsSearching(true)

    try {
      const item = await findItemByCode(code.trim())
      const scanResult: ScanResult = {
        code: code.trim(),
        format: 'MANUAL',
        item: item || undefined,
        found: !!item,
      }
      setResult(scanResult)
      setResultOpen(true)
      onResult?.(scanResult)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Keyboard className="h-5 w-5" />
            手入力で検索
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="manual-code" className="sr-only">
                コード
              </Label>
              <Input
                id="manual-code"
                placeholder="部品コードまたは型番を入力"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={isSearching}
              />
            </div>
            <Button type="submit" disabled={!code.trim() || isSearching}>
              {isSearching ? (
                <Spinner size="sm" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <ScanResultDialog
          result={result}
          open={resultOpen}
          onOpenChange={setResultOpen}
        />
      )}
    </>
  )
}
