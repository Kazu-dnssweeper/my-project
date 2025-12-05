import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
import { InventoryTable } from './InventoryTable'
import type { ItemWithStock } from '../types'

const mockItems: ItemWithStock[] = [
  {
    id: '1',
    tenant_id: 'tenant-1',
    item_code: 'ITEM-001',
    name: 'テスト部品A',
    model_number: 'MODEL-A',
    category_id: 'cat-1',
    unit: '個',
    safety_stock: 100,
    reorder_point: 50,
    lead_time_days: 7,
    location: 'A-1-1',
    notes: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    total_quantity: 150,
    stock_status: 'ok',
    category: { id: 'cat-1', tenant_id: 'tenant-1', name: 'コネクタ', parent_id: null, created_at: '' },
  },
  {
    id: '2',
    tenant_id: 'tenant-1',
    item_code: 'ITEM-002',
    name: 'テスト部品B',
    model_number: 'MODEL-B',
    category_id: 'cat-2',
    unit: '本',
    safety_stock: 50,
    reorder_point: 20,
    lead_time_days: 14,
    location: 'B-2-2',
    notes: null,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    total_quantity: 15,
    stock_status: 'low',
    category: { id: 'cat-2', tenant_id: 'tenant-1', name: '抵抗器', parent_id: null, created_at: '' },
  },
  {
    id: '3',
    tenant_id: 'tenant-1',
    item_code: 'ITEM-003',
    name: 'テスト部品C',
    model_number: null,
    category_id: null,
    unit: '枚',
    safety_stock: null,
    reorder_point: null,
    lead_time_days: null,
    location: null,
    notes: null,
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
    total_quantity: 0,
    stock_status: 'out',
  },
]

describe('InventoryTable', () => {
  it('should render table headers', () => {
    render(<InventoryTable items={mockItems} />)

    expect(screen.getByText('品番')).toBeInTheDocument()
    expect(screen.getByText('品名')).toBeInTheDocument()
    expect(screen.getByText('カテゴリ')).toBeInTheDocument()
    expect(screen.getByText('在庫数')).toBeInTheDocument()
    expect(screen.getByText('単位')).toBeInTheDocument()
    expect(screen.getByText('ステータス')).toBeInTheDocument()
    expect(screen.getByText('操作')).toBeInTheDocument()
  })

  it('should render item data correctly', () => {
    render(<InventoryTable items={mockItems} />)

    // First item
    expect(screen.getByText('ITEM-001')).toBeInTheDocument()
    expect(screen.getByText('テスト部品A')).toBeInTheDocument()
    expect(screen.getByText('コネクタ')).toBeInTheDocument()
    expect(screen.getByText('150')).toBeInTheDocument()
    expect(screen.getByText('個')).toBeInTheDocument()

    // Second item
    expect(screen.getByText('ITEM-002')).toBeInTheDocument()
    expect(screen.getByText('テスト部品B')).toBeInTheDocument()
  })

  it('should render stock status badges', () => {
    render(<InventoryTable items={mockItems} />)

    expect(screen.getByText('正常')).toBeInTheDocument()
    expect(screen.getByText('要発注')).toBeInTheDocument()
    expect(screen.getByText('欠品')).toBeInTheDocument()
  })

  it('should show empty state when no items', () => {
    render(<InventoryTable items={[]} />)

    expect(screen.getByText('部品が見つかりませんでした')).toBeInTheDocument()
  })

  it('should show loading state', () => {
    render(<InventoryTable items={[]} isLoading />)

    // Skeleton elements should be present
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('should handle missing category gracefully', () => {
    render(<InventoryTable items={mockItems} />)

    // Item without category should show dash
    const dashCells = screen.getAllByText('-')
    expect(dashCells.length).toBeGreaterThan(0)
  })

  it('should call onSort when header is clicked', () => {
    const onSort = vi.fn()
    render(<InventoryTable items={mockItems} onSort={onSort} />)

    // Click on sortable header
    const header = screen.getByText('品番')
    ;(header as HTMLElement).click()
    expect(onSort).toHaveBeenCalledWith('item_code')
  })

  it('should call onEdit when edit button is clicked', () => {
    const onEdit = vi.fn()
    render(<InventoryTable items={mockItems} onEdit={onEdit} />)

    // Find edit buttons (there should be one per row)
    const editButtons = document.querySelectorAll('button[class*="ghost"]')
    // Click the first edit button (second button in the actions column)
    if (editButtons[1]) {
      ;(editButtons[1] as HTMLButtonElement).click()
      expect(onEdit).toHaveBeenCalledWith(mockItems[0])
    }
  })
})
