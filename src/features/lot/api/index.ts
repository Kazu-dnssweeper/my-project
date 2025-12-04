import { createClient } from '@/lib/supabase/client'
import type { LotWithDetails, LotSummary, FifoSuggestion } from '../types'
import { differenceInDays } from 'date-fns'

const supabase = createClient()

export async function getLots(): Promise<LotSummary[]> {
  const { data, error } = await supabase
    .from('inventory')
    .select(`
      *,
      item:item_id(*),
      warehouse:warehouse_id(*)
    `)
    .not('lot_number', 'is', null)
    .order('expiry_date', { ascending: true, nullsFirst: false })

  if (error) {
    throw new Error(error.message)
  }

  const now = new Date()
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  return (data || []).map((inv) => {
    const expiryDate = inv.expiry_date ? new Date(inv.expiry_date) : null
    const isExpired = expiryDate ? expiryDate < now : false
    const isExpiringSoon = expiryDate
      ? expiryDate >= now && expiryDate <= thirtyDaysFromNow
      : false
    const daysUntilExpiry = expiryDate ? differenceInDays(expiryDate, now) : null

    return {
      lot_number: inv.lot_number,
      item: inv.item,
      warehouse: inv.warehouse,
      quantity: inv.quantity,
      received_date: inv.received_date,
      expiry_date: inv.expiry_date,
      isExpired,
      isExpiringSoon,
      daysUntilExpiry,
    } as LotSummary
  })
}

export async function getLot(id: string): Promise<LotWithDetails> {
  const { data, error } = await supabase
    .from('inventory')
    .select(`
      *,
      item:item_id(*),
      warehouse:warehouse_id(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // 取引履歴も取得
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('inventory_id', id)
    .order('transacted_at', { ascending: false })

  return {
    ...data,
    transactions: transactions || [],
  } as LotWithDetails
}

export async function getLotsForItem(itemId: string): Promise<LotSummary[]> {
  const allLots = await getLots()
  return allLots.filter((lot) => lot.item.id === itemId)
}

export async function getFifoSuggestions(
  itemId: string,
  requiredQuantity: number
): Promise<FifoSuggestion[]> {
  const lots = await getLotsForItem(itemId)

  // 有効期限順（早いもの優先）、入庫日順でソート
  const sortedLots = [...lots]
    .filter((lot) => lot.quantity > 0)
    .sort((a, b) => {
      // 期限切れは最優先
      if (a.isExpired && !b.isExpired) return -1
      if (!a.isExpired && b.isExpired) return 1

      // 期限切れ間近を優先
      if (a.isExpiringSoon && !b.isExpiringSoon) return -1
      if (!a.isExpiringSoon && b.isExpiringSoon) return 1

      // 有効期限順
      if (a.expiry_date && b.expiry_date) {
        return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
      }
      if (a.expiry_date && !b.expiry_date) return -1
      if (!a.expiry_date && b.expiry_date) return 1

      // 入庫日順（古いもの優先）
      if (a.received_date && b.received_date) {
        return new Date(a.received_date).getTime() - new Date(b.received_date).getTime()
      }

      return 0
    })

  const suggestions: FifoSuggestion[] = []
  let remainingQuantity = requiredQuantity

  for (const lot of sortedLots) {
    if (remainingQuantity <= 0) break

    const lotData = await getLot(lot.item.id) // Get full lot data
    const suggestedQuantity = Math.min(lot.quantity, remainingQuantity)

    let reason = 'FIFO: 先入れ先出し'
    if (lot.isExpired) {
      reason = '期限切れロット（優先消化）'
    } else if (lot.isExpiringSoon) {
      reason = `期限切れ間近（残り${lot.daysUntilExpiry}日）`
    }

    suggestions.push({
      lot: lotData,
      suggestedQuantity,
      reason,
    })

    remainingQuantity -= suggestedQuantity
  }

  return suggestions
}
