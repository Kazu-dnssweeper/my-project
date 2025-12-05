import { supabase } from '@/lib/supabase/client'
import type { Item } from '@/types'

export async function findItemByCode(code: string): Promise<Item | null> {
  // まず item_code で検索
  const { data: itemByCode } = await supabase
    .from('items')
    .select('*')
    .eq('item_code', code)
    .single()

  if (itemByCode) {
    return itemByCode as Item
  }

  // 次に model_number で検索
  const { data: itemByModel } = await supabase
    .from('items')
    .select('*')
    .eq('model_number', code)
    .single()

  if (itemByModel) {
    return itemByModel as Item
  }

  return null
}
