import type { Item, Inventory, Category, Warehouse, PaginationParams } from '@/types'

export type { Item, Inventory }

export interface ItemWithStock extends Item {
  total_quantity: number
  stock_status: 'ok' | 'warning' | 'low' | 'out'
}

export interface ItemFilters {
  search?: string
  category_id?: string
  stock_status?: 'ok' | 'warning' | 'low' | 'out' | 'all'
}

export interface ItemsParams extends PaginationParams {
  filters?: ItemFilters
  sort_by?: 'item_code' | 'name' | 'quantity' | 'created_at'
  sort_order?: 'asc' | 'desc'
}

export interface CreateItemData {
  item_code: string
  name: string
  model_number?: string
  category_id?: string
  unit: string
  safety_stock?: number
  reorder_point?: number
  lead_time_days?: number
  location?: string
  notes?: string
}

export interface UpdateItemData extends Partial<CreateItemData> {
  id: string
}

export interface InventoryDetail {
  item: Item
  inventories: Inventory[]
  total_quantity: number
  categories: Category[]
  warehouses: Warehouse[]
}
