import { supabase } from '@/lib/supabase/client'
import { logger } from '@/lib/logger'
import type { Item, Category, Warehouse, Inventory } from '@/types'
import type { ItemWithStock, ItemFilters, CreateItemData, UpdateItemData } from '../types'

export async function getItems(
  filters?: ItemFilters,
  page = 1,
  limit = 20,
  sortBy = 'item_code',
  sortOrder: 'asc' | 'desc' = 'asc'
): Promise<{ data: ItemWithStock[]; total: number }> {
  let query = supabase
    .from('items')
    .select(`
      *,
      category:categories(id, name),
      inventory(quantity)
    `, { count: 'exact' })
    .eq('is_active', true)

  if (filters?.search) {
    query = query.or(`item_code.ilike.%${filters.search}%,name.ilike.%${filters.search}%`)
  }

  if (filters?.category_id) {
    query = query.eq('category_id', filters.category_id)
  }

  const { data, error, count } = await query
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .range((page - 1) * limit, page * limit - 1)

  if (error) {
    logger.error('Failed to get items', error)
    return { data: [], total: 0 }
  }

  const itemsWithStock: ItemWithStock[] = (data || []).map((item) => {
    const totalQuantity = item.inventory?.reduce(
      (sum: number, inv: { quantity: number }) => sum + (inv.quantity || 0),
      0
    ) || 0

    let stockStatus: 'ok' | 'warning' | 'low' | 'out' = 'ok'
    if (totalQuantity === 0) {
      stockStatus = 'out'
    } else if (item.reorder_point && totalQuantity <= item.reorder_point) {
      stockStatus = 'low'
    } else if (item.safety_stock && totalQuantity <= item.safety_stock) {
      stockStatus = 'warning'
    }

    return {
      ...item,
      total_quantity: totalQuantity,
      stock_status: stockStatus,
    } as ItemWithStock
  })

  // Filter by stock status if specified
  let filteredItems = itemsWithStock
  if (filters?.stock_status && filters.stock_status !== 'all') {
    filteredItems = itemsWithStock.filter((item) => item.stock_status === filters.stock_status)
  }

  return { data: filteredItems, total: count || 0 }
}

export async function getItem(id: string): Promise<Item | null> {
  const { data, error } = await supabase
    .from('items')
    .select(`
      *,
      category:categories(id, name)
    `)
    .eq('id', id)
    .single()

  if (error) {
    logger.error('Failed to get item', error, { itemId: id })
    return null
  }

  return data as Item
}

export async function getItemInventories(itemId: string): Promise<Inventory[]> {
  const { data, error } = await supabase
    .from('inventory')
    .select(`
      *,
      warehouse:warehouses(id, name)
    `)
    .eq('item_id', itemId)
    .gt('quantity', 0)
    .order('received_date', { ascending: true })

  if (error) {
    logger.error('Failed to get inventories', error, { itemId })
    return []
  }

  return data as Inventory[]
}

export async function createItem(data: CreateItemData): Promise<Item | null> {
  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id')
    .single()

  if (!userData?.tenant_id) {
    throw new Error('Tenant not found')
  }

  const { data: item, error } = await supabase
    .from('items')
    .insert({
      ...data,
      tenant_id: userData.tenant_id,
    })
    .select()
    .single()

  if (error) {
    logger.error('Failed to create item', error, { data })
    throw new Error(error.message)
  }

  return item as Item
}

export async function updateItem(id: string, data: Partial<CreateItemData>): Promise<Item | null> {
  const { data: item, error } = await supabase
    .from('items')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    logger.error('Failed to update item', error, { id, data })
    throw new Error(error.message)
  }

  return item as Item
}

export async function deleteItem(id: string): Promise<void> {
  const { error } = await supabase
    .from('items')
    .update({ is_active: false })
    .eq('id', id)

  if (error) {
    logger.error('Failed to delete item', error, { id })
    throw new Error(error.message)
  }
}

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  if (error) {
    logger.error('Failed to get categories', error)
    return []
  }

  return data as Category[]
}

export async function getWarehouses(): Promise<Warehouse[]> {
  const { data, error } = await supabase
    .from('warehouses')
    .select('*')
    .order('name')

  if (error) {
    logger.error('Failed to get warehouses', error)
    return []
  }

  return data as Warehouse[]
}
