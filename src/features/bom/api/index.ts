import { createClient } from '@/lib/supabase/client'
import type { BomWithItems, BomFormData, BomUpdateData } from '../types'

const supabase = createClient()

export async function getBoms(): Promise<BomWithItems[]> {
  const { data, error } = await supabase
    .from('bom')
    .select(`
      *,
      parent_item:parent_item_id(*),
      child_item:child_item_id(*)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data || []) as BomWithItems[]
}

export async function getBom(id: string): Promise<BomWithItems> {
  const { data, error } = await supabase
    .from('bom')
    .select(`
      *,
      parent_item:parent_item_id(*),
      child_item:child_item_id(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data as BomWithItems
}

export async function getBomsByParentItem(parentItemId: string): Promise<BomWithItems[]> {
  const { data, error } = await supabase
    .from('bom')
    .select(`
      *,
      parent_item:parent_item_id(*),
      child_item:child_item_id(*)
    `)
    .eq('parent_item_id', parentItemId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return (data || []) as BomWithItems[]
}

export async function createBom(data: BomFormData): Promise<BomWithItems> {
  const { data: bom, error } = await supabase
    .from('bom')
    .insert({
      parent_item_id: data.parent_item_id,
      child_item_id: data.child_item_id,
      quantity: data.quantity,
      version: data.version,
      effective_from: data.effective_from,
      effective_to: data.effective_to,
    })
    .select(`
      *,
      parent_item:parent_item_id(*),
      child_item:child_item_id(*)
    `)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return bom as BomWithItems
}

export async function updateBom(id: string, data: BomUpdateData): Promise<BomWithItems> {
  const { data: bom, error } = await supabase
    .from('bom')
    .update({
      quantity: data.quantity,
      version: data.version,
      effective_from: data.effective_from,
      effective_to: data.effective_to,
    })
    .eq('id', id)
    .select(`
      *,
      parent_item:parent_item_id(*),
      child_item:child_item_id(*)
    `)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return bom as BomWithItems
}

export async function deleteBom(id: string): Promise<void> {
  const { error } = await supabase.from('bom').delete().eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}
