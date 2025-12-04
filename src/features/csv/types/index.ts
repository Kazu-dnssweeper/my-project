export type CsvEntityType = 'items' | 'inventory' | 'transactions'

export interface CsvColumn {
  key: string
  label: string
  required?: boolean
}

export interface CsvMapping {
  sourceColumn: string
  targetColumn: string
}

export interface CsvImportResult {
  success: number
  failed: number
  errors: Array<{
    row: number
    message: string
  }>
}

export interface CsvExportOptions {
  entityType: CsvEntityType
  includeHeaders?: boolean
  encoding?: 'utf-8' | 'shift-jis'
}

export const ITEM_COLUMNS: CsvColumn[] = [
  { key: 'item_code', label: '部品コード', required: true },
  { key: 'name', label: '部品名', required: true },
  { key: 'model_number', label: '型番' },
  { key: 'unit', label: '単位', required: true },
  { key: 'safety_stock', label: '安全在庫' },
  { key: 'reorder_point', label: '発注点' },
  { key: 'lead_time_days', label: 'リードタイム(日)' },
  { key: 'location', label: '保管場所' },
  { key: 'notes', label: '備考' },
]

export const INVENTORY_COLUMNS: CsvColumn[] = [
  { key: 'item_code', label: '部品コード', required: true },
  { key: 'warehouse_name', label: '倉庫名', required: true },
  { key: 'lot_number', label: 'ロット番号' },
  { key: 'quantity', label: '数量', required: true },
  { key: 'received_date', label: '入庫日' },
  { key: 'expiry_date', label: '有効期限' },
]
