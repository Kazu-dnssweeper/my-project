# PartStock 開発タスクリスト

Claude Codeで開発する際は、このタスクを上から順に実行してください。
各タスクは独立してテスト可能な単位になっています。

---

## Phase 0: プロジェクトセットアップ

### Task 0-1: Next.jsプロジェクト作成
```bash
npx create-next-app@latest partstock --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd partstock
```

### Task 0-2: 依存パッケージインストール
```bash
npm install @supabase/supabase-js @supabase/ssr zustand react-hook-form @hookform/resolvers zod @tanstack/react-query date-fns lucide-react
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

### Task 0-3: shadcn/ui導入
```bash
npx shadcn@latest init
npx shadcn@latest add button input label card dialog select checkbox badge toast skeleton table dropdown-menu avatar separator
```

### Task 0-4: ディレクトリ構造作成
```bash
mkdir -p src/components/{ui,forms,data-display,layouts}
mkdir -p src/features/{inventory,transaction,bom,lot,barcode}/{components,hooks,api,types}
mkdir -p src/hooks src/lib/{supabase,utils} src/types src/stores
```

### Task 0-5: Supabaseクライアント設定
ファイル作成:
- `src/lib/supabase/client.ts` - ブラウザ用
- `src/lib/supabase/server.ts` - サーバー用
- `src/lib/supabase/middleware.ts` - ミドルウェア用

### Task 0-6: 環境変数設定
`.env.local` にSupabaseの認証情報を設定

---

## Phase 1: Atoms（基本UI部品）

### Task 1-1: Buttonカスタマイズ
`src/components/ui/button.tsx` をプロジェクト用にカスタマイズ
- variant: default, secondary, danger, ghost, link
- size: sm, md, lg
- loading状態対応

### Task 1-2: Inputカスタマイズ
`src/components/ui/input.tsx`
- エラー状態のスタイル
- アイコン対応（prefix/suffix）

### Task 1-3: Badge作成
`src/components/ui/badge.tsx`
- variant: default, success, warning, danger, info

### Task 1-4: Spinner作成
`src/components/ui/spinner.tsx`
- size: sm, md, lg

---

## Phase 2: Molecules（フォーム部品）

### Task 2-1: FormField作成
`src/components/forms/form-field.tsx`
```typescript
interface FormFieldProps {
  label: string
  name: string
  error?: string
  required?: boolean
  children: React.ReactNode
}
```

### Task 2-2: SearchBox作成
`src/components/forms/search-box.tsx`
- 検索アイコン付きInput
- debounce対応
- クリアボタン

### Task 2-3: NumberInput作成
`src/components/forms/number-input.tsx`
- +/- ボタン付き
- min/max制限
- step指定

### Task 2-4: SelectField作成
`src/components/forms/select-field.tsx`
- Label + Select + Error の組み合わせ

### Task 2-5: ComboBox作成
`src/components/forms/combo-box.tsx`
- 検索可能なドロップダウン
- 非同期検索対応

---

## Phase 3: Molecules（表示部品）

### Task 3-1: DataTable作成
`src/components/data-display/data-table.tsx`
```typescript
interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  isLoading?: boolean
  onRowClick?: (row: T) => void
  pagination?: { page: number; limit: number; total: number }
  onPageChange?: (page: number) => void
}
```

### Task 3-2: KPICard作成
`src/components/data-display/kpi-card.tsx`
- タイトル、値、前期比、アイコン

### Task 3-3: AlertCard作成
`src/components/data-display/alert-card.tsx`
- type: info, warning, error, success
- アクションボタン対応

### Task 3-4: EmptyState作成
`src/components/data-display/empty-state.tsx`
- アイコン、タイトル、説明、アクションボタン

### Task 3-5: StatusBadge作成
`src/components/data-display/status-badge.tsx`
- 在庫ステータス表示用（ok, warning, low, out）

### Task 3-6: Pagination作成
`src/components/data-display/pagination.tsx`
- ページ番号、前へ/次へ、件数表示

---

## Phase 4: Layouts

### Task 4-1: AppShell作成
`src/components/layouts/app-shell.tsx`
- Header + SideNav + Main の3カラムレイアウト
- レスポンシブ対応

### Task 4-2: Header作成
`src/components/layouts/header.tsx`
- ロゴ、グローバル検索、ユーザーメニュー

### Task 4-3: SideNav作成
`src/components/layouts/side-nav.tsx`
- ナビゲーションメニュー
- アクティブ状態
- 折りたたみ対応

### Task 4-4: PageHeader作成
`src/components/layouts/page-header.tsx`
- ページタイトル、パンくず、アクションボタン

### Task 4-5: AuthLayout作成
`src/components/layouts/auth-layout.tsx`
- ログイン/登録ページ用のセンタリングレイアウト

---

## Phase 5: Feature - inventory/

### Task 5-1: 型定義
`src/features/inventory/types/index.ts`
```typescript
interface Item {
  id: string
  tenant_id: string
  item_code: string
  name: string
  model_number?: string
  category_id?: string
  unit: string
  safety_stock: number
  reorder_point: number
  lead_time_days: number
  location?: string
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
}
```

### Task 5-2: API関数
`src/features/inventory/api/index.ts`
- `getItems(filters)` - 一覧取得
- `getItem(id)` - 詳細取得
- `createItem(data)` - 作成
- `updateItem(id, data)` - 更新
- `deleteItem(id)` - 削除

### Task 5-3: カスタムフック
`src/features/inventory/hooks/useInventory.ts`
- `useItems(filters)` - 一覧取得フック
- `useItem(id)` - 詳細取得フック
- `useCreateItem()` - 作成ミューテーション
- `useUpdateItem()` - 更新ミューテーション
- `useDeleteItem()` - 削除ミューテーション

### Task 5-4: InventoryTable
`src/features/inventory/components/inventory-table.tsx`
- 在庫一覧テーブル
- ソート、フィルタ対応

### Task 5-5: InventoryForm
`src/features/inventory/components/inventory-form.tsx`
- 部品登録/編集フォーム
- バリデーション（Zod）

### Task 5-6: InventoryFilters
`src/features/inventory/components/inventory-filters.tsx`
- カテゴリ、ステータス、検索フィルター

### Task 5-7: InventoryCard
`src/features/inventory/components/inventory-card.tsx`
- 部品サマリーカード表示

---

## Phase 6: Feature - transaction/

### Task 6-1: 型定義
`src/features/transaction/types/index.ts`

### Task 6-2: API関数
`src/features/transaction/api/index.ts`

### Task 6-3: カスタムフック
`src/features/transaction/hooks/useTransaction.ts`

### Task 6-4: TransactionForm
`src/features/transaction/components/transaction-form.tsx`
- 入出庫登録フォーム

### Task 6-5: TransactionTable
`src/features/transaction/components/transaction-table.tsx`
- 取引履歴一覧

### Task 6-6: TransactionTypeSelect
`src/features/transaction/components/transaction-type-select.tsx`
- IN/OUT/MOVE選択

---

## Phase 7: Feature - barcode/

### Task 7-1: BarcodeScanner
`src/features/barcode/components/barcode-scanner.tsx`
- カメラでのバーコード読み取り
- @zxing/browser使用

### Task 7-2: BarcodeInput
`src/features/barcode/components/barcode-input.tsx`
- スキャン + 手入力切り替え

### Task 7-3: LabelGenerator
`src/features/barcode/components/label-generator.tsx`
- バーコードラベルPDF生成

---

## Phase 7.5: 拡張認証機能

### Task 7.5-1: Google OAuth認証
- [x] GoogleLoginButtonコンポーネント作成
- [x] OAuthコールバック（`/auth/callback`）実装
- [x] Google Cloud Console設定
- [x] Supabase Google Provider設定
- [x] Supabase RLSポリシー設定（anon/authenticated用）

### Task 7.5-2: パスワードリセット機能
- [x] ForgotPasswordFormコンポーネント作成
- [x] ResetPasswordFormコンポーネント作成
- [x] `/forgot-password`ページ作成
- [x] `/reset-password`ページ作成

### Task 7.5-3: ユーザー招待機能
- [x] 招待API（`api/invite.ts`）作成
- [x] useInviteフック作成
- [x] InviteUserDialogコンポーネント作成
- [x] AcceptInviteFormコンポーネント作成
- [x] `/accept-invite`ページ作成

### Task 7.5-4: ロールベースアクセス制御
- [x] permissions.ts（権限チェック関数）作成
- [x] RoleGuardコンポーネント作成
- [x] UserRole型定義（admin/editor/viewer）

### Task 7.5-5: オンボーディング
- [x] OnboardingFormコンポーネント作成
- [x] `/onboarding`ページ作成
- [x] 初回OAuthユーザーのテナント作成フロー（create_tenant_with_admin関数）

---

## Phase 7.6: DB関数

### Task 7.6-1: ユーザー管理関数
- [x] `handle_new_user()` - 新規ユーザー作成時の自動処理トリガー
- [x] `create_tenant_with_admin()` - テナント作成とユーザー紐付け

### Task 7.6-2: ダッシュボードKPI関数
- [x] `get_dashboard_kpi()` - KPIを効率的に取得するDB関数
- [x] ダッシュボードAPIをDB関数呼び出しに更新

### Task 7.6-3: 在庫アラート関数
- [x] `get_stock_alerts()` - 発注点以下の部品を取得
- [x] アラートAPIをDB関数呼び出しに更新

### Task 7.6-4: RLSポリシー追加
- [x] 新規ユーザー用テナント作成ポリシー
- [x] 招待テーブルRLSポリシー
- [x] invitationsテーブル作成

---

## Phase 8: ページ組み立て

### Task 8-1: 認証ページ
- [x] `src/app/(auth)/login/page.tsx`
- [x] `src/app/(auth)/register/page.tsx`
- [x] `src/app/(auth)/layout.tsx`

### Task 8-2: ダッシュボード
- `src/app/(dashboard)/dashboard/page.tsx`
- KPIカード、アラート一覧

### Task 8-3: 在庫一覧
- `src/app/(dashboard)/inventory/page.tsx`
- InventoryFilters + InventoryTable

### Task 8-4: 在庫詳細
- `src/app/(dashboard)/inventory/[id]/page.tsx`
- 部品詳細 + 取引履歴

### Task 8-5: 入出庫登録
- `src/app/(dashboard)/transactions/new/page.tsx`
- TransactionForm + BarcodeInput

### Task 8-6: 取引履歴
- `src/app/(dashboard)/transactions/page.tsx`
- TransactionTable

---

## 完了チェックリスト

各タスク完了時に確認:
- [ ] TypeScriptエラーなし（`npm run type-check`）
- [ ] ESLintエラーなし（`npm run lint`）
- [ ] 開発サーバーで動作確認（`npm run dev`）
- [ ] 主要な操作が正常に動作

---

## Claude Codeへの指示例

```
Task 5-4を実装してください。
CLAUDE.mdの設計に従って、
src/features/inventory/components/inventory-table.tsx を作成してください。
DataTableコンポーネントを使用し、Item型のデータを表示します。
```

```
Phase 2を全て実装してください。
src/components/forms/ 配下のコンポーネントを順番に作成してください。
```
