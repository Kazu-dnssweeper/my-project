# PartStock 開発タスクリスト

Claude Codeで開発する際は、このタスクを上から順に実行してください。
各タスクは独立してテスト可能な単位になっています。

---

## 進捗サマリー

| Phase | 状態 | 完了/全体 |
|-------|------|----------|
| Phase 0 セットアップ | ✅ 完了 | 26/26 |
| Phase 1 Atoms | ✅ 完了 | 18/18 |
| Phase 2 Molecules (Forms) | ⬜ 未着手 | 0/15 |
| Phase 3 Molecules (Display) | ⬜ 未着手 | 0/18 |
| Phase 4 Layouts | ✅ 完了 | 12/12 |
| Phase 5 inventory | ✅ 完了 | 24/24 |
| Phase 6 transaction | 🔶 部分完了 | 28/42 |
| Phase 7 barcode | 🔶 部分完了 | 18/38 |
| Phase 7.5 拡張認証 | ✅ 完了 | 20/20 |
| Phase 7.6 DB関数 | ✅ 完了 | 12/12 |
| Phase 8 ページ | ✅ 完了 | 24/24 |
| Phase 9 テスト | ✅ 完了 | 12/12 |

---

## Phase 0: プロジェクトセットアップ

### Task 0-1: Next.jsプロジェクト作成
- [x] create-next-app実行
- [x] TypeScript設定
- [x] Tailwind CSS設定
- [x] ESLint設定
- [x] App Router有効化
- [x] src/ディレクトリ構成

### Task 0-2: 依存パッケージインストール
- [x] @supabase/supabase-js
- [x] @supabase/ssr
- [x] zustand
- [x] react-hook-form + @hookform/resolvers
- [x] zod
- [x] @tanstack/react-query
- [x] date-fns
- [x] lucide-react
- [x] vitest (dev)
- [x] @testing-library/react (dev)

### Task 0-3: shadcn/ui導入
- [x] shadcn/ui初期化
- [x] button
- [x] input
- [x] label
- [x] card
- [x] dialog
- [x] select
- [x] checkbox
- [x] badge
- [x] skeleton
- [x] table
- [x] dropdown-menu
- [x] avatar
- [x] separator
- [x] alert
- [x] popover
- [x] scroll-area

### Task 0-4: ディレクトリ構造作成
- [x] src/components/ui/
- [x] src/components/forms/
- [x] src/components/data-display/
- [x] src/components/layouts/
- [x] src/features/ (inventory, transaction, bom, lot, barcode)
- [x] src/hooks/
- [x] src/lib/supabase/
- [x] src/types/
- [x] src/stores/

### Task 0-5: Supabaseクライアント設定
- [x] src/lib/supabase/client.ts（ブラウザ用）
- [x] src/lib/supabase/server.ts（サーバー用）
- [x] src/lib/supabase/middleware.ts

### Task 0-6: 環境変数設定
- [x] .env.local作成
- [x] NEXT_PUBLIC_SUPABASE_URL
- [x] NEXT_PUBLIC_SUPABASE_ANON_KEY

---

## Phase 1: Atoms（基本UI部品）

### Task 1-1: Button
`src/components/ui/button.tsx`
- [x] variant: default
- [x] variant: secondary
- [x] variant: destructive
- [x] variant: ghost
- [x] variant: link
- [x] variant: outline
- [x] size: sm, default, lg, icon
- [x] disabled状態
- [x] loading状態（Spinner表示）

### Task 1-2: Input
`src/components/ui/input.tsx`
- [x] 基本Input
- [x] disabled状態
- [x] エラー状態スタイル

### Task 1-3: Badge
`src/components/ui/badge.tsx`
- [x] variant: default
- [x] variant: secondary
- [x] variant: destructive
- [x] variant: outline

### Task 1-4: Spinner
`src/components/ui/spinner.tsx`
- [x] size: sm
- [x] size: md (default)
- [x] size: lg

---

## Phase 2: Molecules（フォーム部品）

### Task 2-1: FormField
`src/components/forms/form-field.tsx`
- [ ] Label + Input + Error のラッパー
- [ ] required表示（*マーク）
- [ ] エラーメッセージ表示
- [ ] ヘルプテキスト表示

### Task 2-2: SearchBox
`src/components/forms/search-box.tsx`
- [ ] 検索アイコン付きInput
- [ ] debounce対応（300ms）
- [ ] クリアボタン
- [ ] プレースホルダー

### Task 2-3: NumberInput
`src/components/forms/number-input.tsx`
- [ ] +/- ステッパーボタン
- [ ] min/max制限
- [ ] step指定
- [ ] 直接入力対応

### Task 2-4: SelectField
`src/components/forms/select-field.tsx`
- [ ] Label + Select + Error の組み合わせ
- [ ] プレースホルダー
- [ ] disabled状態

### Task 2-5: ComboBox
`src/components/forms/combo-box.tsx`
- [ ] 検索可能なドロップダウン
- [ ] 非同期検索対応
- [ ] ローディング表示
- [ ] 「該当なし」表示

---

## Phase 3: Molecules（表示部品）

### Task 3-1: DataTable
`src/components/data-display/data-table.tsx`
- [ ] ジェネリック型対応
- [ ] カラム定義
- [ ] ソート機能
- [ ] ローディング状態（Skeleton）
- [ ] 空状態表示
- [ ] 行クリックイベント

### Task 3-2: Pagination
`src/components/data-display/pagination.tsx`
- [ ] ページ番号表示
- [ ] 前へ/次へボタン
- [ ] 先頭/末尾ボタン
- [ ] 件数表示（1-10 of 100）
- [ ] ページサイズ選択

### Task 3-3: KPICard
`src/components/data-display/kpi-card.tsx`
- [x] タイトル表示（※features/dashboard/components/KPICard.tsxとして実装済み）
- [x] 値表示
- [x] 前期比表示
- [x] アイコン表示

### Task 3-4: AlertCard
`src/components/data-display/alert-card.tsx`
- [ ] type: info
- [ ] type: warning
- [ ] type: error
- [ ] type: success
- [ ] アクションボタン

### Task 3-5: EmptyState
`src/components/data-display/empty-state.tsx`
- [ ] アイコン表示
- [ ] タイトル
- [ ] 説明文
- [ ] アクションボタン

### Task 3-6: StatusBadge
`src/components/data-display/status-badge.tsx`
- [ ] status: ok（緑）
- [ ] status: warning（黄）
- [ ] status: low（オレンジ）
- [ ] status: out（赤）

---

## Phase 4: Layouts

### Task 4-1: AppShell
`src/components/layouts/AppShell.tsx`
- [x] Header + SideNav + Main レイアウト
- [x] レスポンシブ対応
- [x] サイドバー折りたたみ

### Task 4-2: Header
`src/components/layouts/Header.tsx`
- [x] ロゴ表示
- [x] グローバル検索
- [x] 通知ベル
- [x] ユーザーメニュー

### Task 4-3: SideNav
`src/components/layouts/SideNav.tsx`
- [x] ナビゲーションリンク
- [x] アクティブ状態ハイライト
- [x] アイコン + ラベル
- [x] 折りたたみ時はアイコンのみ

### Task 4-4: PageHeader
`src/components/layouts/PageHeader.tsx`
- [x] ページタイトル
- [x] パンくずリスト
- [x] アクションボタンエリア

### Task 4-5: AuthLayout
`src/components/layouts/AuthLayout.tsx`
- [x] センタリングレイアウト
- [x] ロゴ表示
- [x] カード形式フォーム

---

## Phase 5: Feature - inventory/

### Task 5-1: 型定義
`src/features/inventory/types/index.ts`
- [x] Item interface
- [x] ItemWithStock interface
- [x] CreateItemInput type
- [x] UpdateItemInput type
- [x] ItemFilters type
- [x] StockStatus type（ok/warning/low/out）

### Task 5-2: API関数
`src/features/inventory/api/index.ts`
- [x] getItems(filters, pagination)
- [x] getItem(id)
- [x] createItem(data)
- [x] updateItem(id, data)
- [x] deleteItem(id)
- [x] getCategories()

### Task 5-3: カスタムフック
`src/features/inventory/hooks/useItems.ts`
- [x] useItems(filters) - 一覧取得
- [x] useItem(id) - 詳細取得
- [x] useCreateItem() - 作成mutation
- [x] useUpdateItem() - 更新mutation
- [x] useDeleteItem() - 削除mutation

### Task 5-4: InventoryTable
`src/features/inventory/components/InventoryTable.tsx`
- [x] 部品一覧テーブル表示
- [x] カラム: 品番、品名、カテゴリ、在庫数、単位、ステータス
- [x] ソート機能
- [x] ステータスバッジ表示
- [x] 行クリックで詳細遷移
- [x] React.memo最適化

### Task 5-5: InventoryForm
`src/features/inventory/components/InventoryForm.tsx`
- [x] 部品登録/編集フォーム
- [x] Zodバリデーション
- [x] カテゴリ選択
- [x] 単位選択
- [x] 送信処理

### Task 5-6: InventoryFilters
`src/features/inventory/components/InventoryFilters.tsx`
- [x] キーワード検索
- [x] カテゴリフィルター
- [x] ステータスフィルター

---

## Phase 6: Feature - transaction/

### Task 6-1: 型定義
`src/features/transaction/types/index.ts`
- [x] TransactionType定義（IN/OUT/MOVE）
- [x] TransactionSubType定義（purchase/sales/scrap等）
- [x] Transaction interface
- [x] TransactionWithDetails interface
- [x] CreateTransactionData type
- [x] TransactionFilters type

### Task 6-2: API関数
`src/features/transaction/api/index.ts`
- [x] getTransactions(filters, pagination)
- [x] getItemTransactions(itemId)
- [x] createTransaction(data)
- [x] getInventoriesForTransaction(itemId)
- [ ] updateTransaction(id, data) ※未実装
- [ ] deleteTransaction(id) ※未実装

### Task 6-3: カスタムフック
`src/features/transaction/hooks/useTransactions.ts`
- [x] useTransactions(filters)
- [x] useItemTransactions(itemId)
- [x] useCreateTransaction()
- [ ] useUpdateTransaction() ※未実装
- [ ] useDeleteTransaction() ※未実装

### Task 6-4: TransactionTable
`src/features/transaction/components/TransactionTable.tsx`
- [x] 取引履歴テーブル
- [x] カラム: 日時、品番、品名、タイプ、数量、倉庫、備考
- [x] タイプ別バッジ（IN=青、OUT=赤、MOVE=黄）
- [x] 数量の符号表示（+100/-50）
- [x] React.memo最適化
- [x] useMemo日付フォーマット

### Task 6-5: TransactionForm
`src/features/transaction/components/TransactionForm.tsx`
- [x] タイプ選択（入庫/出庫/移動）
- [x] 部品選択
- [x] 倉庫選択
- [x] 数量入力
- [x] ロット番号入力
- [x] 備考入力
- [x] Zodバリデーション

### Task 6-6: TransactionFilters
`src/features/transaction/components/TransactionFilters.tsx`
- [x] タイプフィルター
- [x] 日付範囲フィルター
- [x] キーワード検索

### Task 6-7: TransactionSummary
`src/features/transaction/components/TransactionSummary.tsx`
- [ ] 期間別入出庫サマリー ※未実装
- [ ] グラフ表示 ※未実装

---

## Phase 7: Feature - barcode/

### Task 7-1: 型定義
`src/features/barcode/types/index.ts`
- [x] BarcodeFormat type
- [x] ScanResult interface
- [x] LabelSize type

### Task 7-2: BarcodeScanner
`src/features/barcode/components/BarcodeScanner.tsx`
- [x] カメラプレビュー表示
- [x] @zxing/library使用
- [x] カメラ権限リクエスト
- [x] 背面カメラ優先選択
- [x] カメラ切り替えボタン
- [x] ローディング表示
- [x] エラーハンドリング
- [x] スキャン枠オーバーレイ
- [x] 閉じるボタン
- [ ] 連続スキャンモード切替 ※部分実装
- [ ] スキャン成功時バイブレーション ※未実装
- [ ] フラッシュライト制御 ※未実装
- [ ] スキャン音 ※未実装

### Task 7-3: BarcodeScanButton
`src/features/barcode/components/BarcodeScanButton.tsx`
- [x] スキャン開始ボタン
- [x] アイコン表示

### Task 7-4: ManualEntryFallback
`src/features/barcode/components/ManualEntryFallback.tsx`
- [x] 手入力フォーム
- [x] バーコード形式検証

### Task 7-5: ScanResultDialog
`src/features/barcode/components/ScanResultDialog.tsx`
- [x] スキャン結果表示
- [x] 部品情報表示
- [x] アクション選択（入庫/出庫）

### Task 7-6: LabelGenerator
`src/features/barcode/components/LabelGenerator.tsx`
- [ ] ラベルサイズ選択 ※未実装
- [ ] バーコード生成 ※未実装
- [ ] QRコード生成 ※未実装
- [ ] PDF出力 ※未実装
- [ ] 印刷プレビュー ※未実装

### Task 7-7: LabelPreview
`src/features/barcode/components/LabelPreview.tsx`
- [ ] ラベルプレビュー表示 ※未実装
- [ ] 品番/品名表示 ※未実装
- [ ] バーコード画像表示 ※未実装

### Task 7-8: ScanHistory
`src/features/barcode/components/ScanHistory.tsx`
- [ ] スキャン履歴一覧 ※未実装
- [ ] 再スキャン機能 ※未実装
- [ ] 履歴クリア ※未実装

---

## Phase 7.5: 拡張認証機能

### Task 7.5-1: Google OAuth
- [x] GoogleLoginButtonコンポーネント
- [x] /auth/callbackルート
- [x] Supabase Google Provider設定

### Task 7.5-2: パスワードリセット
- [x] ForgotPasswordForm
- [x] ResetPasswordForm（トークン検証）
- [x] /forgot-passwordページ
- [x] /reset-passwordページ

### Task 7.5-3: ユーザー招待
- [x] 招待API（api/invite.ts）
- [x] useInviteフック
- [x] InviteUserDialog
- [x] AcceptInviteForm
- [x] /accept-inviteページ

### Task 7.5-4: ロールベースアクセス制御
- [x] permissions.ts（canEdit, canDelete等）
- [x] RoleGuardコンポーネント
- [x] UserRole型（admin/editor/viewer）

### Task 7.5-5: オンボーディング
- [x] OnboardingForm
- [x] /onboardingページ
- [x] create_tenant_with_admin関数連携

---

## Phase 7.6: DB関数

### Task 7.6-1: ユーザー管理関数
`supabase/functions.sql`
- [x] handle_new_user() トリガー関数
- [x] create_tenant_with_admin(tenant_name, user_id)
- [x] auth.users作成時トリガー設定

### Task 7.6-2: ダッシュボードKPI関数
- [x] get_dashboard_kpi(tenant_id)
- [x] total_items計算
- [x] total_stock計算
- [x] low_stock_count計算
- [x] today_transactions計算

### Task 7.6-3: 在庫アラート関数
- [x] get_stock_alerts(tenant_id, limit)
- [x] 発注点以下の部品取得
- [x] 在庫ゼロの部品取得

### Task 7.6-4: invitationsテーブル
- [x] テーブル作成
- [x] RLSポリシー設定

---

## Phase 8: ページ組み立て

### Task 8-1: 認証ページ
- [x] /login（LoginForm配置）
- [x] /register（RegisterForm配置）
- [x] (auth)/layout.tsx

### Task 8-2: ダッシュボード
- [x] /dashboard
- [x] KPIGrid配置
- [x] StockAlertList配置
- [x] RecentTransactions配置

### Task 8-3: 在庫一覧
- [x] /inventory
- [x] InventoryFilters配置
- [x] InventoryTable配置
- [x] 新規登録ダイアログ

### Task 8-4: 在庫詳細
- [x] /inventory/[id]
- [x] 部品詳細表示
- [x] ロット別在庫表示
- [x] 取引履歴表示

### Task 8-5: 入出庫登録
- [x] /transactions/new
- [x] TransactionForm配置

### Task 8-6: 取引履歴
- [x] /transactions
- [x] TransactionFilters配置
- [x] TransactionTable配置

### Task 8-7: その他ページ
- [x] /lots（ロット一覧）
- [x] /bom（BOM管理）
- [x] /scan（バーコードスキャン）
- [x] /import-export（CSV入出力）

---

## Phase 9: テスト/最適化

### Task 9-1: テスト環境
- [x] vitest.config.ts
- [x] src/test/setup.ts（モック設定）
- [x] src/test/test-utils.tsx
- [x] package.json testスクリプト

### Task 9-2: ユニットテスト
- [x] utils.test.ts
- [x] use-debounce.test.ts

### Task 9-3: コンポーネントテスト
- [x] InventoryTable.test.tsx
- [x] TransactionTable.test.tsx

### Task 9-4: パフォーマンス最適化
- [x] InventoryTable - React.memo適用
- [x] TransactionTable - React.memo適用
- [x] TableRow分離・メモ化
- [x] useCallback/useMemo適用

---

## 追加実装済みFeature

### Feature - dashboard/
- [x] 型定義
- [x] KPICard, KPIGrid
- [x] StockAlertList
- [x] RecentTransactions
- [x] useDashboardKPI, useStockAlerts, useRecentTransactions

### Feature - alerts/
- [x] 型定義
- [x] AlertDropdown, AlertBadge, AlertBanner
- [x] useAlerts, useAlertCount
- [x] API関数

### Feature - lot/
- [x] 型定義
- [x] LotTable, LotDetailCard, LotHistoryTable
- [x] LotExpiryAlert, FifoSuggestion
- [x] useLot
- [x] API関数

### Feature - bom/
- [x] 型定義
- [x] BomTable, BomEditDialog, BomDeleteDialog, BomActionMenu
- [x] useBom
- [x] API関数

### Feature - csv/
- [x] 型定義
- [x] CsvImportDialog, CsvExportButton, CsvPreviewTable
- [x] API関数

---

## 未実装タスク一覧（次回対応）

### 優先度: 高
- [ ] Phase 2: 共通フォームコンポーネント（FormField, SearchBox等）
- [ ] Phase 3: 共通表示コンポーネント（DataTable, Pagination等）
- [ ] Task 6-2: updateTransaction, deleteTransaction
- [ ] Task 7-6: LabelGenerator（バーコードラベル生成）

### 優先度: 中
- [ ] Task 6-7: TransactionSummary
- [ ] Task 7-7: LabelPreview
- [ ] Task 7-8: ScanHistory
- [ ] Task 7-2: スキャン時バイブレーション/フラッシュ

### 優先度: 低
- [ ] E2Eテスト追加
- [ ] Storybookセットアップ
