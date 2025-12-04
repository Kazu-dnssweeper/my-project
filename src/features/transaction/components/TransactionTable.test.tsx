import { describe, it, expect } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { TransactionTable } from './TransactionTable'
import type { TransactionWithDetails } from '../types'

const mockTransactions: TransactionWithDetails[] = [
  {
    id: '1',
    tenant_id: 'tenant-1',
    inventory_id: 'inv-1',
    type: 'IN',
    sub_type: 'purchase',
    quantity: 100,
    user_id: 'user-1',
    note: '通常入庫',
    transacted_at: '2024-01-15T10:30:00Z',
    created_at: '2024-01-15T10:30:00Z',
    item_name: 'テスト部品A',
    item_code: 'ITEM-001',
    warehouse_name: 'メイン倉庫',
  },
  {
    id: '2',
    tenant_id: 'tenant-1',
    inventory_id: 'inv-1',
    type: 'OUT',
    sub_type: 'sales',
    quantity: 50,
    user_id: 'user-1',
    note: '出荷',
    transacted_at: '2024-01-16T14:00:00Z',
    created_at: '2024-01-16T14:00:00Z',
    item_name: 'テスト部品A',
    item_code: 'ITEM-001',
    warehouse_name: 'メイン倉庫',
  },
  {
    id: '3',
    tenant_id: 'tenant-1',
    inventory_id: 'inv-2',
    type: 'MOVE',
    sub_type: 'transfer',
    quantity: 25,
    user_id: 'user-1',
    note: null,
    transacted_at: '2024-01-17T09:00:00Z',
    created_at: '2024-01-17T09:00:00Z',
    item_name: 'テスト部品B',
    item_code: 'ITEM-002',
    warehouse_name: 'メイン倉庫 → 第2倉庫',
  },
]

describe('TransactionTable', () => {
  it('should render table headers', () => {
    render(<TransactionTable transactions={mockTransactions} />)

    expect(screen.getByText('日時')).toBeInTheDocument()
    expect(screen.getByText('種別')).toBeInTheDocument()
    expect(screen.getByText('品番')).toBeInTheDocument()
    expect(screen.getByText('品名')).toBeInTheDocument()
    expect(screen.getByText('数量')).toBeInTheDocument()
    expect(screen.getByText('倉庫')).toBeInTheDocument()
    expect(screen.getByText('ロット')).toBeInTheDocument()
    expect(screen.getByText('備考')).toBeInTheDocument()
  })

  it('should render transaction data correctly', () => {
    render(<TransactionTable transactions={mockTransactions} />)

    expect(screen.getByText('ITEM-001')).toBeInTheDocument()
    expect(screen.getByText('テスト部品A')).toBeInTheDocument()
    expect(screen.getByText('メイン倉庫')).toBeInTheDocument()
    expect(screen.getByText('通常入庫')).toBeInTheDocument()
  })

  it('should render transaction type badges', () => {
    render(<TransactionTable transactions={mockTransactions} />)

    expect(screen.getByText('入庫')).toBeInTheDocument()
    expect(screen.getByText('出庫')).toBeInTheDocument()
    expect(screen.getByText('移動')).toBeInTheDocument()
  })

  it('should render sub type labels', () => {
    render(<TransactionTable transactions={mockTransactions} />)

    expect(screen.getByText('(仕入)')).toBeInTheDocument()
    expect(screen.getByText('(販売)')).toBeInTheDocument()
    expect(screen.getByText('(移動)')).toBeInTheDocument()
  })

  it('should show empty state when no transactions', () => {
    render(<TransactionTable transactions={[]} />)

    expect(screen.getByText('取引履歴がありません')).toBeInTheDocument()
  })

  it('should show loading state', () => {
    render(<TransactionTable transactions={[]} isLoading />)

    const skeletons = document.querySelectorAll('[class*="animate-pulse"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('should hide item columns when showItem is false', () => {
    render(<TransactionTable transactions={mockTransactions} showItem={false} />)

    // Item code and name should not be in headers
    expect(screen.queryByText('品番')).not.toBeInTheDocument()
    expect(screen.queryByText('品名')).not.toBeInTheDocument()
  })

  it('should format quantity with sign based on type', () => {
    render(<TransactionTable transactions={mockTransactions} />)

    // IN type should have +
    expect(screen.getByText('+100')).toBeInTheDocument()

    // OUT type should have -
    expect(screen.getByText('-50')).toBeInTheDocument()
  })

  it('should handle null note gracefully', () => {
    render(<TransactionTable transactions={mockTransactions} />)

    // Null notes should show dash
    const dashCells = screen.getAllByText('-')
    expect(dashCells.length).toBeGreaterThan(0)
  })
})
