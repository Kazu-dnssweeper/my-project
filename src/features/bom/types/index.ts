import type { Bom, Item } from '@/types'

export interface BomWithItems extends Bom {
  parent_item: Item
  child_item: Item
}

export interface BomFormData {
  parent_item_id: string
  child_item_id: string
  quantity: number
  version: string
  effective_from?: string | null
  effective_to?: string | null
}

export interface BomUpdateData {
  quantity?: number
  version?: string
  effective_from?: string | null
  effective_to?: string | null
}
