// 共通型定義
export type ID = string

export interface BaseEntity {
  id: ID
  created_at: string
  updated_at?: string
}

export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

// テナント
export interface Tenant extends BaseEntity {
  name: string
}

// ユーザー権限
export type UserRole = 'admin' | 'editor' | 'viewer'

// ユーザー
export interface User extends BaseEntity {
  tenant_id: ID
  email: string
  name: string | null
  role: UserRole
}

// カテゴリ
export interface Category extends BaseEntity {
  tenant_id: ID
  name: string
  parent_id: ID | null
}

// 倉庫
export interface Warehouse extends BaseEntity {
  tenant_id: ID
  name: string
  location: string | null
}

// 部品マスタ
export interface Item extends BaseEntity {
  tenant_id: ID
  item_code: string
  name: string
  model_number: string | null
  category_id: ID | null
  unit: string
  safety_stock: number | null
  reorder_point: number | null
  lead_time_days: number | null
  location: string | null
  notes: string | null
  category?: Category
}

// 在庫
export interface Inventory extends BaseEntity {
  tenant_id: ID
  item_id: ID
  warehouse_id: ID
  lot_number: string | null
  quantity: number
  received_date: string | null
  expiry_date: string | null
  item?: Item
  warehouse?: Warehouse
}

// 取引種別
export type TransactionType = 'IN' | 'OUT' | 'MOVE'

// 取引履歴
export interface Transaction extends BaseEntity {
  tenant_id: ID
  inventory_id: ID
  type: TransactionType
  sub_type: string | null
  quantity: number
  user_id: ID
  note: string | null
  transacted_at: string
  inventory?: Inventory
  user?: User
}

// BOM（部品表）
export interface Bom extends BaseEntity {
  tenant_id: ID
  parent_item_id: ID
  child_item_id: ID
  quantity: number
  version: string
  effective_from: string | null
  effective_to: string | null
  parent_item?: Item
  child_item?: Item
}
