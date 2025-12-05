import { createClient } from '@/lib/supabase/client'
import type { Transaction, Inventory } from '@/types'
import type {
  TransactionWithDetails,
  TransactionFilters,
  CreateTransactionData,
  InventoryForTransaction,
} from '../types'

const supabase = createClient()

export async function getTransactions(
  filters?: TransactionFilters,
  page = 1,
  limit = 20
): Promise<{ data: TransactionWithDetails[]; total: number }> {
  let query = supabase
    .from('transactions')
    .select(`
      *,
      item:items!transactions_item_id_fkey(id, item_code, name),
      from_warehouse:warehouses!transactions_from_warehouse_id_fkey(id, name),
      to_warehouse:warehouses!transactions_to_warehouse_id_fkey(id, name)
    `, { count: 'exact' })

  if (filters?.type && filters.type !== 'all') {
    query = query.eq('type', filters.type)
  }

  if (filters?.item_id) {
    query = query.eq('item_id', filters.item_id)
  }

  if (filters?.date_from) {
    query = query.gte('transacted_at', filters.date_from)
  }

  if (filters?.date_to) {
    query = query.lte('transacted_at', `${filters.date_to}T23:59:59`)
  }

  if (filters?.search) {
    // Note: This requires a separate query for item search
    const { data: items } = await supabase
      .from('items')
      .select('id')
      .or(`item_code.ilike.%${filters.search}%,name.ilike.%${filters.search}%`)

    if (items && items.length > 0) {
      const itemIds = items.map((i) => i.id)
      query = query.in('item_id', itemIds)
    }
  }

  const { data, error, count } = await query
    .order('transacted_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (error) {
    console.error('Failed to get transactions:', error)
    return { data: [], total: 0 }
  }

  const transactions: TransactionWithDetails[] = (data || []).map((tx) => ({
    ...tx,
    item_name: tx.item?.name || '',
    item_code: tx.item?.item_code || '',
    warehouse_name: tx.type === 'MOVE'
      ? `${tx.from_warehouse?.name || ''} → ${tx.to_warehouse?.name || ''}`
      : tx.from_warehouse?.name || tx.to_warehouse?.name || '',
  }))

  return { data: transactions, total: count || 0 }
}

export async function getItemTransactions(
  itemId: string,
  limit = 10
): Promise<TransactionWithDetails[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      from_warehouse:warehouses!transactions_from_warehouse_id_fkey(id, name),
      to_warehouse:warehouses!transactions_to_warehouse_id_fkey(id, name)
    `)
    .eq('item_id', itemId)
    .order('transacted_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Failed to get item transactions:', error)
    return []
  }

  return (data || []).map((tx) => ({
    ...tx,
    item_name: '',
    item_code: '',
    warehouse_name: tx.type === 'MOVE'
      ? `${tx.from_warehouse?.name || ''} → ${tx.to_warehouse?.name || ''}`
      : tx.from_warehouse?.name || tx.to_warehouse?.name || '',
  }))
}

export async function createTransaction(
  data: CreateTransactionData
): Promise<Transaction | null> {
  const { data: userData } = await supabase
    .from('users')
    .select('id, tenant_id')
    .single()

  if (!userData?.tenant_id) {
    throw new Error('Tenant not found')
  }

  // Find or create inventory record
  let inventoryId: string | null = null

  if (data.type === 'IN') {
    // For IN transactions, find existing inventory or create new one
    const { data: existing } = await supabase
      .from('inventory')
      .select('id')
      .eq('item_id', data.item_id)
      .eq('warehouse_id', data.warehouse_id)
      .eq('lot_number', data.lot_number || '')
      .single()

    if (existing) {
      inventoryId = existing.id
    } else {
      // Create new inventory record
      const { data: newInv, error: invError } = await supabase
        .from('inventory')
        .insert({
          tenant_id: userData.tenant_id,
          item_id: data.item_id,
          warehouse_id: data.warehouse_id,
          lot_number: data.lot_number || null,
          quantity: 0,
          received_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single()

      if (invError) {
        throw new Error('Failed to create inventory record')
      }
      inventoryId = newInv.id
    }
  } else if (data.type === 'OUT') {
    // For OUT transactions, find inventory with available quantity
    const { data: existing } = await supabase
      .from('inventory')
      .select('id, quantity')
      .eq('item_id', data.item_id)
      .eq('warehouse_id', data.warehouse_id)
      .gt('quantity', 0)
      .order('received_date', { ascending: true }) // FIFO
      .limit(1)
      .single()

    if (!existing) {
      throw new Error('在庫がありません')
    }

    if (existing.quantity < data.quantity) {
      throw new Error('在庫数量が不足しています')
    }

    inventoryId = existing.id
  }

  // Create transaction
  const { data: tx, error } = await supabase
    .from('transactions')
    .insert({
      tenant_id: userData.tenant_id,
      inventory_id: inventoryId,
      item_id: data.item_id,
      type: data.type,
      sub_type: data.sub_type || null,
      quantity: data.quantity,
      lot_number: data.lot_number || null,
      from_warehouse_id: data.type === 'OUT' || data.type === 'MOVE' ? data.warehouse_id : null,
      to_warehouse_id: data.type === 'IN' ? data.warehouse_id : data.to_warehouse_id || null,
      user_id: userData.id,
      note: data.note || null,
      transacted_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create transaction:', error)
    throw new Error(error.message)
  }

  return tx as Transaction
}

export async function getInventoriesForTransaction(
  itemId?: string
): Promise<InventoryForTransaction[]> {
  let query = supabase
    .from('inventory')
    .select(`
      *,
      item:items(id, item_code, name, unit),
      warehouse:warehouses(id, name)
    `)
    .gt('quantity', 0)

  if (itemId) {
    query = query.eq('item_id', itemId)
  }

  const { data, error } = await query.order('received_date', { ascending: true })

  if (error) {
    console.error('Failed to get inventories:', error)
    return []
  }

  return data as InventoryForTransaction[]
}

export interface UpdateTransactionData {
  quantity?: number
  note?: string
  sub_type?: string
}

export async function updateTransaction(
  id: string,
  data: UpdateTransactionData
): Promise<Transaction | null> {
  const { data: tx, error } = await supabase
    .from('transactions')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Failed to update transaction:', error)
    throw new Error(error.message)
  }

  return tx as Transaction
}

export async function deleteTransaction(id: string): Promise<void> {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Failed to delete transaction:', error)
    throw new Error(error.message)
  }
}
