'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { History, Trash2, RotateCcw, Package, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import type { ScanResult } from '../types'

interface ScanHistoryEntry {
  id: string
  code: string
  format: string
  found: boolean
  itemName?: string
  scannedAt: Date
}

interface ScanHistoryProps {
  onRescan?: (code: string) => void
  className?: string
}

const STORAGE_KEY = 'partstock-scan-history'
const MAX_HISTORY = 50

function loadHistory(): ScanHistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    return parsed.map((entry: ScanHistoryEntry) => ({
      ...entry,
      scannedAt: new Date(entry.scannedAt),
    }))
  } catch {
    return []
  }
}

function saveHistory(history: ScanHistoryEntry[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)))
}

export function useScanHistory() {
  const [history, setHistory] = React.useState<ScanHistoryEntry[]>([])

  React.useEffect(() => {
    setHistory(loadHistory())
  }, [])

  const addEntry = React.useCallback((result: ScanResult) => {
    const entry: ScanHistoryEntry = {
      id: crypto.randomUUID(),
      code: result.code,
      format: result.format,
      found: result.found,
      itemName: result.item?.name,
      scannedAt: new Date(),
    }

    setHistory((prev) => {
      const newHistory = [entry, ...prev].slice(0, MAX_HISTORY)
      saveHistory(newHistory)
      return newHistory
    })
  }, [])

  const clearHistory = React.useCallback(() => {
    setHistory([])
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const removeEntry = React.useCallback((id: string) => {
    setHistory((prev) => {
      const newHistory = prev.filter((e) => e.id !== id)
      saveHistory(newHistory)
      return newHistory
    })
  }, [])

  return { history, addEntry, clearHistory, removeEntry }
}

export function ScanHistory({ onRescan, className }: ScanHistoryProps) {
  const { history, clearHistory, removeEntry } = useScanHistory()

  if (history.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <History className="h-4 w-4" />
            スキャン履歴
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Clock className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">スキャン履歴はありません</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <History className="h-4 w-4" />
          スキャン履歴
          <Badge variant="secondary" className="ml-1">
            {history.length}
          </Badge>
        </CardTitle>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 text-destructive">
              <Trash2 className="h-4 w-4 mr-1" />
              クリア
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>履歴をクリア</AlertDialogTitle>
              <AlertDialogDescription>
                スキャン履歴をすべて削除します。この操作は取り消せません。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>キャンセル</AlertDialogCancel>
              <AlertDialogAction onClick={clearHistory}>削除</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px]">
          <div className="divide-y">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 p-3 hover:bg-muted/50"
              >
                <div
                  className={cn(
                    'p-2 rounded-full',
                    entry.found ? 'bg-green-100 dark:bg-green-900' : 'bg-gray-100 dark:bg-gray-800'
                  )}
                >
                  <Package
                    className={cn(
                      'h-4 w-4',
                      entry.found ? 'text-green-600 dark:text-green-400' : 'text-gray-500'
                    )}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-medium truncate">{entry.code}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{entry.format}</span>
                    <span>•</span>
                    <span>
                      {format(entry.scannedAt, 'M/d HH:mm', { locale: ja })}
                    </span>
                    {entry.itemName && (
                      <>
                        <span>•</span>
                        <span className="truncate">{entry.itemName}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {entry.found ? (
                    <Badge variant="secondary" className="text-xs">
                      登録済み
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      未登録
                    </Badge>
                  )}
                  {onRescan && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onRescan(entry.code)}
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span className="sr-only">再スキャン</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
