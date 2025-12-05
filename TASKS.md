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
- [x] プロジェクト作成完了

### Task 0-2: 依存パッケージインストール
```bash
npm install @supabase/supabase-js @supabase/ssr zustand react-hook-form @hookform/resolvers zod @tanstack/react-query date-fns lucide-react
npm install -D vitest @testing-library/react @testing-library/jest-dom
```
- [x] 本番依存パッケージインストール
- [x] 開発依存パッケージインストール

### Task 0-3: shadcn/ui導入
```bash
npx shadcn@latest init
npx shadcn@latest add button input label card dialog select checkbox badge toast skeleton table dropdown-menu avatar separator
```
- [x] shadcn/ui初期化
- [x] button追加
- [x] input追加
- [x] label追加
- [x] card追加
- [x] dialog追加
- [x] select追加
- [x] checkbox追加
- [x] badge追加
- [x] skeleton追加
- [x] table追加
- [x] dropdown-menu追加
- [x] avatar追加
- [x] separator追加

### Task 0-4: ディレクトリ構造作成
```bash
mkdir -p src/components/{ui,forms,data-display,layouts}
mkdir -p src/features/{inventory,transaction,bom,lot,barcode}/{components,hooks,api,types}
mkdir -p src/hooks src/lib/{supabase,utils} src/types src/stores
```
- [x] components/ui作成
- [x] components/forms作成
- [x] components/data-display作成
- [x] components/layouts作成
- [x] features/inventory作成
- [x] features/transaction作成
- [x] features/bom作成
- [x] features/lot作成
- [x] features/barcode作成
- [x] hooks作成
- [x] lib/supabase作成
- [x] lib/utils作成
- [x] types作成
- [x] stores作成

### Task 0-5: Supabaseクライアント設定
- [x] `src/lib/supabase/client.ts` - ブラウザ用クライアント
- [x] `src/lib/supabase/server.ts` - サーバー用クライアント
- [x] `src/lib/supabase/middleware.ts` - ミドルウェア用

### Task 0-6: 環境変数設定
- [x] `.env.local` にSupabaseの認証情報を設定

---

## Phase 1: Atoms（基本UI部品）

### Task 1-1: Buttonカスタマイズ
`src/components/ui/button.tsx` をプロジェクト用にカスタマイズ
- [x] variant: default
- [x] variant: secondary
- [x] variant: destructive
- [x] variant: ghost
- [x] variant: link
- [x] size: sm, default, lg
- [x] loading状態対応

### Task 1-2: Inputカスタマイズ
`src/components/ui/input.tsx`
- [x] 基本Input実装
- [x] エラー状態のスタイル

### Task 1-3: Badge作成
`src/components/ui/badge.tsx`
- [x] variant: default
- [x] variant: secondary
- [x] variant: destructive
- [x] variant: outline

### Task 1-4: Spinner作成
`src/components/ui/spinner.tsx`
- [x] 基本Spinner実装
- [x] size: sm, md, lg

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
- [ ] FormField基本実装
- [ ] ラベル表示
- [ ] エラーメッセージ表示
- [ ] required表示

### Task 2-2: SearchBox作成
`src/components/forms/search-box.tsx`
- [ ] 検索アイコン付きInput
- [ ] debounce対応
- [ ] クリアボタン

### Task 2-3: NumberInput作成
`src/components/forms/number-input.tsx`
- [ ] +/- ボタン付き
- [ ] min/max制限
- [ ] step指定

### Task 2-4: SelectField作成
`src/components/forms/select-field.tsx`
- [ ] Label + Select + Error の組み合わせ

### Task 2-5: ComboBox作成
`src/components/forms/combo-box.tsx`
- [ ] 検索可能なドロップダウン
- [ ] 非同期検索対応

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
- [ ] 基本DataTable実装
- [ ] ローディング状態
- [ ] ページネーション対応
- [ ] 行クリック対応

### Task 3-2: KPICard作成
`src/components/data-display/kpi-card.tsx`
- [x] タイトル、値、前期比、アイコン表示（features/dashboard/components/KPICard.tsxとして実装済み）

### Task 3-3: AlertCard作成
`src/components/data-display/alert-card.tsx`
- [ ] type: info, warning, error, success
- [ ] アクションボタン対応

### Task 3-4: EmptyState作成
`src/components/data-display/empty-state.tsx`
- [ ] アイコン、タイトル、説明、アクションボタン

### Task 3-5: StatusBadge作成
`src/components/data-display/status-badge.tsx`
- [ ] 在庫ステータス表示用（ok, warning, low, out）

### Task 3-6: Pagination作成
`src/components/data-display/pagination.tsx`
- [ ] ページ番号表示
- [ ] 前へ/次へボタン
- [ ] 件数表示

---

## Phase 4: Layouts

### Task 4-1: AppShell作成
`src/components/layouts/app-shell.tsx`
- [x] Header + SideNav + Main の3カラムレイアウト
- [x] レスポンシブ対応

### Task 4-2: Header作成
`src/components/layouts/header.tsx`
- [x] ロゴ表示
- [x] グローバル検索
- [x] ユーザーメニュー

### Task 4-3: SideNav作成
`src/components/layouts/side-nav.tsx`
- [x] ナビゲーションメニュー
- [x] アクティブ状態
- [x] 折りたたみ対応

### Task 4-4: PageHeader作成
`src/components/layouts/page-header.tsx`
- [x] ページタイトル
- [x] パンくず
- [x] アクションボタン

### Task 4-5: AuthLayout作成
`src/components/layouts/auth-layout.tsx`
- [x] ログイン/登録ページ用のセンタリングレイアウト

---

## Phase 5: Feature - inventory/

### Task 5-1: 型定義
`src/features/inventory/types/index.ts`
- [x] Item型定義
- [x] ItemWithStock型定義
- [x] CreateItemInput型定義
- [x] UpdateItemInput型定義
- [x] ItemFilters型定義

### Task 5-2: API関数
`src/features/inventory/api/index.ts`
- [x] getItems(filters) - 一覧取得
- [x] getItem(id) - 詳細取得
- [x] createItem(data) - 作成
- [x] updateItem(id, data) - 更新
- [x] deleteItem(id) - 削除

### Task 5-3: カスタムフック
`src/features/inventory/hooks/useInventory.ts`
- [x] useItems(filters) - 一覧取得フック
- [x] useItem(id) - 詳細取得フック
- [x] useCreateItem() - 作成ミューテーション
- [x] useUpdateItem() - 更新ミューテーション
- [x] useDeleteItem() - 削除ミューテーション

### Task 5-4: InventoryTable
`src/features/inventory/components/inventory-table.tsx`
- [x] 在庫一覧テーブル
- [x] ソート対応
- [x] ステータスバッジ表示
- [x] 操作ボタン（詳細/編集）

### Task 5-5: InventoryForm
`src/features/inventory/components/inventory-form.tsx`
- [x] 部品登録/編集フォーム
- [x] バリデーション（Zod）
- [x] 送信処理

### Task 5-6: InventoryFilters
`src/features/inventory/components/inventory-filters.tsx`
- [x] カテゴリフィルター
- [x] ステータスフィルター
- [x] 検索フィルター

### Task 5-7: InventoryCard
`src/features/inventory/components/inventory-card.tsx`
- [ ] 部品サマリーカード表示

---

## Phase 6: Feature - transaction/

### Task 6-1: 型定義
`src/features/transaction/types/index.ts`
- [x] Transaction型定義
- [x] TransactionWithDetails型定義
- [x] CreateTransactionInput型定義
- [x] TransactionFilters型定義

### Task 6-2: API関数
`src/features/transaction/api/index.ts`
- [x] getTransactions(filters) - 一覧取得
- [x] createTransaction(data) - 作成

### Task 6-3: カスタムフック
`src/features/transaction/hooks/useTransaction.ts`
- [x] useTransactions(filters) - 一覧取得フック
- [x] useCreateTransaction() - 作成ミューテーション

### Task 6-4: TransactionForm
`src/features/transaction/components/transaction-form.tsx`
- [x] 入出庫登録フォーム
- [x] 入庫/出庫/移動タイプ選択
- [x] バリデーション

### Task 6-5: TransactionTable
`src/features/transaction/components/transaction-table.tsx`
- [x] 取引履歴一覧
- [x] タイプ別バッジ表示
- [x] 数量の符号表示（+/-）

### Task 6-6: TransactionFilters
`src/features/transaction/components/transaction-filters.tsx`
- [x] タイプフィルター
- [x] 日付フィルター
- [x] 検索フィルター

### Task 6-7: TransactionTypeSelect
`src/features/transaction/components/transaction-type-select.tsx`
- [ ] IN/OUT/MOVE選択コンポーネント（TransactionFormに統合済み）

---

## Phase 7: Feature - barcode/

### Task 7-1: BarcodeScanner
`src/features/barcode/components/barcode-scanner.tsx`
- [x] カメラでのバーコード読み取り
- [x] @zxing/browser使用

### Task 7-2: BarcodeScanButton
`src/features/barcode/components/barcode-scan-button.tsx`
- [x] スキャンボタンコンポーネント

### Task 7-3: ManualEntryFallback
`src/features/barcode/components/manual-entry-fallback.tsx`
- [x] 手入力フォールバック

### Task 7-4: ScanResultDialog
`src/features/barcode/components/scan-result-dialog.tsx`
- [x] スキャン結果ダイアログ

### Task 7-5: LabelGenerator
`src/features/barcode/components/label-generator.tsx`
- [ ] バーコードラベルPDF生成

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
- [x] `src/app/(dashboard)/dashboard/page.tsx`
- [x] KPIカード表示
- [x] アラート一覧表示
- [x] 最近の取引表示

### Task 8-3: 在庫一覧
- [x] `src/app/(dashboard)/inventory/page.tsx`
- [x] InventoryFilters配置
- [x] InventoryTable配置
- [x] InventoryForm（登録/編集ダイアログ）

### Task 8-4: 在庫詳細
- [x] `src/app/(dashboard)/inventory/[id]/page.tsx`
- [x] 部品詳細表示
- [x] ロット別在庫表示
- [x] 取引履歴表示

### Task 8-5: 入出庫登録
- [x] `src/app/(dashboard)/transactions/new/page.tsx`
- [x] TransactionForm（入庫/出庫/移動対応）

### Task 8-6: 取引履歴
- [x] `src/app/(dashboard)/transactions/page.tsx`
- [x] TransactionFilters配置
- [x] TransactionTable配置

### Task 8-7: その他ページ
- [x] `src/app/(dashboard)/lots/page.tsx` - ロット一覧
- [x] `src/app/(dashboard)/bom/page.tsx` - BOM管理
- [x] `src/app/(dashboard)/scan/page.tsx` - バーコードスキャン
- [x] `src/app/(dashboard)/import-export/page.tsx` - CSV入出力

---

## Phase 9: テスト/最適化

### Task 9-1: テスト環境セットアップ
- [x] vitest.config.ts作成
- [x] テストセットアップファイル（src/test/setup.ts）
- [x] テストユーティリティ（src/test/test-utils.tsx）
- [x] package.jsonにテストスクリプト追加

### Task 9-2: ユニットテスト
- [x] utils.test.ts（cn関数のテスト）
- [x] use-debounce.test.ts（debounce hookのテスト）

### Task 9-3: コンポーネントテスト
- [x] InventoryTable.test.tsx
- [x] TransactionTable.test.tsx

### Task 9-4: パフォーマンス最適化
- [x] InventoryTable - React.memo, useCallback適用
- [x] TransactionTable - React.memo, useMemo適用
- [x] TableRowコンポーネントのメモ化

---

## 追加Feature（実装済み）

### Feature - dashboard/
- [x] 型定義（src/features/dashboard/types/index.ts）
- [x] KPICard（src/features/dashboard/components/KPICard.tsx）
- [x] KPIGrid（src/features/dashboard/components/KPIGrid.tsx）
- [x] StockAlertList（src/features/dashboard/components/StockAlertList.tsx）
- [x] RecentTransactions（src/features/dashboard/components/RecentTransactions.tsx）
- [x] useDashboardKPI hook
- [x] useStockAlerts hook
- [x] useRecentTransactions hook

### Feature - alerts/
- [x] 型定義（src/features/alerts/types/index.ts）
- [x] AlertDropdown（src/features/alerts/components/AlertDropdown.tsx）
- [x] AlertBadge（src/features/alerts/components/AlertBadge.tsx）
- [x] AlertBanner（src/features/alerts/components/AlertBanner.tsx）
- [x] useAlerts hook
- [x] useAlertCount hook
- [x] API関数

### Feature - lot/
- [x] 型定義（src/features/lot/types/index.ts）
- [x] LotTable（src/features/lot/components/LotTable.tsx）
- [x] LotDetailCard（src/features/lot/components/LotDetailCard.tsx）
- [x] LotHistoryTable（src/features/lot/components/LotHistoryTable.tsx）
- [x] LotExpiryAlert（src/features/lot/components/LotExpiryAlert.tsx）
- [x] FifoSuggestion（src/features/lot/components/FifoSuggestion.tsx）
- [x] useLot hook
- [x] API関数

### Feature - bom/
- [x] 型定義（src/features/bom/types/index.ts）
- [x] BomTable（src/features/bom/components/BomTable.tsx）
- [x] BomEditDialog（src/features/bom/components/BomEditDialog.tsx）
- [x] BomDeleteDialog（src/features/bom/components/BomDeleteDialog.tsx）
- [x] BomActionMenu（src/features/bom/components/BomActionMenu.tsx）
- [x] useBom hook
- [x] API関数

### Feature - csv/
- [x] 型定義（src/features/csv/types/index.ts）
- [x] CsvImportDialog（src/features/csv/components/CsvImportDialog.tsx）
- [x] CsvExportButton（src/features/csv/components/CsvExportButton.tsx）
- [x] CsvPreviewTable（src/features/csv/components/CsvPreviewTable.tsx）
- [x] API関数

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
