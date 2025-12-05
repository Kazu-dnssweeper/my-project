import { format, formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'

/**
 * 日付を指定フォーマットで文字列に変換
 * @param date - Date, string, null, undefined
 * @param formatStr - フォーマット文字列（デフォルト: 'yyyy/MM/dd'）
 * @param fallback - nullやundefinedの場合の代替文字列（デフォルト: '-'）
 */
export function formatDate(
  date: Date | string | null | undefined,
  formatStr: string = 'yyyy/MM/dd',
  fallback: string = '-'
): string {
  if (!date) return fallback

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) return fallback
    return format(dateObj, formatStr)
  } catch {
    return fallback
  }
}

/**
 * 日時を指定フォーマットで文字列に変換
 * @param date - Date, string, null, undefined
 * @param fallback - nullやundefinedの場合の代替文字列（デフォルト: '-'）
 */
export function formatDateTime(
  date: Date | string | null | undefined,
  fallback: string = '-'
): string {
  return formatDate(date, 'yyyy/MM/dd HH:mm', fallback)
}

/**
 * 相対時間を取得（例: 3分前、2時間前）
 * @param date - Date, string, null, undefined
 * @param fallback - nullやundefinedの場合の代替文字列（デフォルト: '-'）
 */
export function formatRelativeTime(
  date: Date | string | null | undefined,
  fallback: string = '-'
): string {
  if (!date) return fallback

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) return fallback
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: ja })
  } catch {
    return fallback
  }
}

/**
 * ISO形式の日付文字列をDate型に変換
 */
export function parseDate(dateString: string | null | undefined): Date | null {
  if (!dateString) return null

  try {
    const date = new Date(dateString)
    return isNaN(date.getTime()) ? null : date
  } catch {
    return null
  }
}
