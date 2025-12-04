'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Spinner } from '@/components/ui/spinner'
import { Download, ChevronDown, Package, Boxes } from 'lucide-react'
import { exportItems, exportInventory, downloadCsv } from '../api'
import { format } from 'date-fns'

interface CsvExportButtonProps {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export function CsvExportButton({
  variant = 'outline',
  size = 'default',
  className,
}: CsvExportButtonProps) {
  const [isExporting, setIsExporting] = useState<string | null>(null)

  const handleExportItems = async () => {
    setIsExporting('items')
    try {
      const csv = await exportItems()
      const filename = `items_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`
      downloadCsv(csv, filename)
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setIsExporting(null)
    }
  }

  const handleExportInventory = async () => {
    setIsExporting('inventory')
    try {
      const csv = await exportInventory()
      const filename = `inventory_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`
      downloadCsv(csv, filename)
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setIsExporting(null)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          disabled={!!isExporting}
        >
          {isExporting ? (
            <Spinner size="sm" className="mr-2" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          エクスポート
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={handleExportItems}
          disabled={isExporting === 'items'}
        >
          <Package className="mr-2 h-4 w-4" />
          部品マスタ
          {isExporting === 'items' && <Spinner size="sm" className="ml-2" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleExportInventory}
          disabled={isExporting === 'inventory'}
        >
          <Boxes className="mr-2 h-4 w-4" />
          在庫データ
          {isExporting === 'inventory' && <Spinner size="sm" className="ml-2" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
