import Papa from 'papaparse'
import { createClient } from '@/lib/supabase/client'
import type { CsvEntityType, CsvImportResult, ITEM_COLUMNS, INVENTORY_COLUMNS } from '../types'
import type { Item } from '@/types'

const supabase = createClient()

export function parseCsv<T = Record<string, unknown>>(
  file: File
): Promise<{ data: T[]; headers: string[] }> {
  return new Promise((resolve, reject) => {
    Papa.parse<T>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || []
        resolve({ data: results.data, headers })
      },
      error: (error) => {
        reject(new Error(error.message))
      },
    })
  })
}

export function generateCsv(
  data: Record<string, unknown>[],
  headers?: string[]
): string {
  return Papa.unparse(data, {
    columns: headers,
  })
}

export async function exportItems(): Promise<string> {
  const { data, error } = await supabase
    .from('items')
    .select('item_code, name, model_number, unit, safety_stock, reorder_point, lead_time_days, location, notes')
    .order('item_code')

  if (error) {
    throw new Error(error.message)
  }

  return generateCsv(data || [], [
    'item_code',
    'name',
    'model_number',
    'unit',
    'safety_stock',
    'reorder_point',
    'lead_time_days',
    'location',
    'notes',
  ])
}

export async function exportInventory(): Promise<string> {
  const { data, error } = await supabase
    .from('inventory')
    .select(`
      quantity,
      lot_number,
      received_date,
      expiry_date,
      item:item_id(item_code),
      warehouse:warehouse_id(name)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  const flatData = (data || []).map((inv) => {
    // Handle Supabase relation types (could be array or single object)
    const item = Array.isArray(inv.item) ? inv.item[0] : inv.item
    const warehouse = Array.isArray(inv.warehouse) ? inv.warehouse[0] : inv.warehouse

    return {
      item_code: (item as { item_code: string } | null)?.item_code || '',
      warehouse_name: (warehouse as { name: string } | null)?.name || '',
      lot_number: inv.lot_number || '',
      quantity: inv.quantity,
      received_date: inv.received_date || '',
      expiry_date: inv.expiry_date || '',
    }
  })

  return generateCsv(flatData, [
    'item_code',
    'warehouse_name',
    'lot_number',
    'quantity',
    'received_date',
    'expiry_date',
  ])
}

export async function importItems(
  data: Record<string, string>[]
): Promise<CsvImportResult> {
  const result: CsvImportResult = {
    success: 0,
    failed: 0,
    errors: [],
  }

  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    const rowNum = i + 2 // 1-indexed + header row

    if (!row.item_code || !row.name || !row.unit) {
      result.failed++
      result.errors.push({
        row: rowNum,
        message: '必須項目（部品コード、部品名、単位）が不足しています',
      })
      continue
    }

    const { error } = await supabase.from('items').upsert(
      {
        item_code: row.item_code,
        name: row.name,
        model_number: row.model_number || null,
        unit: row.unit,
        safety_stock: row.safety_stock ? parseFloat(row.safety_stock) : null,
        reorder_point: row.reorder_point ? parseFloat(row.reorder_point) : null,
        lead_time_days: row.lead_time_days ? parseInt(row.lead_time_days) : null,
        location: row.location || null,
        notes: row.notes || null,
      },
      {
        onConflict: 'tenant_id,item_code',
      }
    )

    if (error) {
      result.failed++
      result.errors.push({
        row: rowNum,
        message: error.message,
      })
    } else {
      result.success++
    }
  }

  return result
}

export function downloadCsv(content: string, filename: string): void {
  const bom = '\uFEFF' // BOM for Excel compatibility
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
