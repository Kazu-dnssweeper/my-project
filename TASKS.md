# PartStock 開発タスクリスト

## タスク管理ルール（必ず守ること）

| 状況 | 操作 | 例 |
|-----|------|-----|
| 新しいタスクが発生 | このファイルに追記 | `- [ ] 新しいタスク` |
| タスク完了 | チェックを入れる | `- [x] 完了したタスク` |
| タスク中止/不要 | 取り消し線で表示 | `- [ ] ~~不要になったタスク~~` |

**注意：タスクは削除しない（履歴として残す）**

---

# 実装状況

> **注意**: 当初の計画（components/forms/, components/data-display/, features/inventory/, features/transaction/）とは異なる構成で実装されました。機能は各featureに直接組み込まれています。

## 実際のディレクトリ構成

```
src/features/
├── auth/        ← 認証（LoginForm, RegisterForm等）
├── dashboard/   ← KPICard, RecentTransactions, StockAlertList
├── alerts/      ← AlertBadge, AlertBanner, AlertDropdown
├── bom/         ← BomTable, BomEditDialog, BomDeleteDialog
├── barcode/     ← BarcodeScanner, BarcodeScanButton
├── lot/         ← LotTable, LotDetailCard, FifoSuggestion
└── csv/         ← CsvExportButton, CsvImportDialog

src/app/(dashboard)/
├── inventory/
│   ├── page.tsx      ← 在庫一覧（検索・フィルター・在庫状況）
│   └── [id]/page.tsx ← 在庫詳細（基本情報・倉庫別在庫・取引履歴）
└── transactions/
    ├── page.tsx      ← 取引履歴一覧（種別フィルター・検索）
    └── new/page.tsx  ← 新規取引登録（入庫・出庫・移動フォーム）
```

> **注意**: inventory/transactions ページは当初 `features/` に分離予定だったが、ページファイル内に直接データ取得ロジックを組み込んで実装

---

# Phase 1: MVP開発

## Phase 0: プロジェクトセットアップ ✅ 完了

- [x] Task 0-1: Next.jsプロジェクト作成
- [x] Task 0-2: 依存パッケージインストール
- [x] Task 0-3: shadcn/ui導入
- [x] Task 0-4: ディレクトリ構造作成
- [x] Task 0-5: Supabaseクライアント設定
- [x] Task 0-6: 環境変数設定

---

## Phase 1: Atoms（基本UI部品） ✅ 完了

- [x] Task 1-1: Buttonカスタマイズ (`src/components/ui/button.tsx`)
- [x] Task 1-2: Inputカスタマイズ (`src/components/ui/input.tsx`)
- [x] Task 1-3: Badge作成 (`src/components/ui/badge.tsx`)
- [x] Task 1-4: Spinner作成 (`src/components/ui/spinner.tsx`)

**追加のshadcn/uiコンポーネント（17ファイル）**:
alert, avatar, card, checkbox, dialog, dropdown-menu, label, popover, scroll-area, select, separator, skeleton, table

---

## Phase 2: Molecules（フォーム部品） ✅ 完了（計画変更）

> 当初 `components/forms/` に作成予定だったが、各featureに直接組み込み済み

- [x] ~~Task 2-1: FormField作成~~ → features/auth/等に組み込み
- [x] ~~Task 2-2: SearchBox作成~~ → 各コンポーネントに組み込み
- [x] ~~Task 2-3: NumberInput作成~~ → 各フォームに組み込み
- [x] ~~Task 2-4: SelectField作成~~ → 各フォームに組み込み
- [x] ~~Task 2-5: ComboBox作成~~ → 各フォームに組み込み

---

## Phase 3: Molecules（表示部品） ✅ 完了（計画変更）

> 当初 `components/data-display/` に作成予定だったが、features/dashboard/等に実装済み

- [x] ~~Task 3-1: DataTable作成~~ → features/bom/BomTable, features/lot/LotTable等
- [x] ~~Task 3-2: KPICard作成~~ → features/dashboard/KPICard.tsx
- [x] ~~Task 3-3: AlertCard作成~~ → features/alerts/AlertBanner.tsx
- [x] ~~Task 3-4: EmptyState作成~~ → 各コンポーネントに組み込み
- [x] ~~Task 3-5: StatusBadge作成~~ → features/alerts/AlertBadge.tsx
- [x] ~~Task 3-6: Pagination作成~~ → 各テーブルに組み込み

---

## Phase 4: Layouts ✅ 完了

- [x] Task 4-1: AppShell作成 (`src/components/layouts/AppShell.tsx`)
- [x] Task 4-2: Header作成 (`src/components/layouts/Header.tsx`)
- [x] Task 4-3: SideNav作成 (`src/components/layouts/SideNav.tsx`)
- [x] Task 4-4: PageHeader作成 (`src/components/layouts/PageHeader.tsx`)
- [x] Task 4-5: AuthLayout作成 (`src/components/layouts/AuthLayout.tsx`)

---

## Phase 5: Feature - inventory/ ✅ 完了（計画変更）

> 当初 `features/inventory/` として計画だったが、lot/bom/dashboard等に分散実装

- [x] ~~Task 5-1: 型定義~~ → src/types/index.ts に統合
- [x] ~~Task 5-2: API関数~~ → features/lot/api, features/bom/api等
- [x] ~~Task 5-3: カスタムフック~~ → features/lot/hooks, features/bom/hooks等
- [x] ~~Task 5-4: InventoryTable~~ → features/lot/LotTable, features/bom/BomTable
- [x] ~~Task 5-5: InventoryForm~~ → 各featureのフォームコンポーネント
- [x] ~~Task 5-6: InventoryFilters~~ → 各featureに組み込み
- [x] ~~Task 5-7: InventoryCard~~ → features/lot/LotDetailCard等

---

## Phase 6: Feature - transaction/ ✅ 完了（計画変更）

> 当初 `features/transaction/` として計画だったが、dashboard/lot等に実装

- [x] ~~Task 6-1: 型定義~~ → src/types/index.ts に統合
- [x] ~~Task 6-2: API関数~~ → features/dashboard/api等
- [x] ~~Task 6-3: カスタムフック~~ → features/dashboard/hooks等
- [x] ~~Task 6-4: TransactionForm~~ → features/lot/等に組み込み
- [x] ~~Task 6-5: TransactionTable~~ → features/dashboard/RecentTransactions.tsx
- [x] ~~Task 6-6: TransactionTypeSelect~~ → 各フォームに組み込み

---

## Phase 7: Feature - barcode/ ✅ 完了

- [x] Task 7-1: BarcodeScanner (`src/features/barcode/components/BarcodeScanner.tsx`)
- [x] Task 7-2: BarcodeScanButton (`src/features/barcode/components/BarcodeScanButton.tsx`)
- [x] Task 7-3: ManualEntryFallback (`src/features/barcode/components/ManualEntryFallback.tsx`)
- [x] Task 7-4: ScanResultDialog (`src/features/barcode/components/ScanResultDialog.tsx`)
- [ ] Task 7-5: LabelGenerator - 未実装

---

## Phase 7.5: 拡張認証機能 ✅ ほぼ完了

### Task 7.5-1: Google OAuth認証
- [x] GoogleLoginButtonコンポーネント作成
- [x] OAuthコールバック（`/auth/callback`）実装
- [x] Supabase RLSポリシー設定（anon/authenticated用）→ schema.sqlに定義済み

### Task 7.5-2: パスワードリセット機能
- [x] ForgotPasswordFormコンポーネント作成
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
- [x] 初回OAuthユーザーのテナント作成フロー確認 → フロントエンド実装済み、setup_new_tenant RPC関数は未実装

---

## Phase 8: ページ組み立て ✅ 完了

### Task 8-1: 認証ページ ✅
- [x] `src/app/(auth)/login/page.tsx`
- [x] `src/app/(auth)/register/page.tsx`
- [x] `src/app/(auth)/forgot-password/page.tsx`
- [x] `src/app/(auth)/accept-invite/page.tsx`
- [x] `src/app/(auth)/onboarding/page.tsx`
- [x] `src/app/(auth)/reset-password/page.tsx`
- [x] `src/app/(auth)/layout.tsx`

### Task 8-2: ダッシュボード ✅
- [x] `src/app/(dashboard)/dashboard/page.tsx`
- [x] KPIGrid, StockAlertList, RecentTransactions統合

### Task 8-3: BOM管理 ✅
- [x] `src/app/(dashboard)/bom/page.tsx`

### Task 8-4: ロット管理 ✅
- [x] `src/app/(dashboard)/lots/page.tsx`

### Task 8-5: バーコードスキャン ✅
- [x] `src/app/(dashboard)/scan/page.tsx`

### Task 8-6: インポート/エクスポート ✅
- [x] `src/app/(dashboard)/import-export/page.tsx`

### Task 8-7: 在庫一覧・詳細 ✅
- [x] `src/app/(dashboard)/inventory/page.tsx`
- [x] `src/app/(dashboard)/inventory/[id]/page.tsx`

### Task 8-8: 取引履歴 ✅
- [x] `src/app/(dashboard)/transactions/page.tsx`
- [x] `src/app/(dashboard)/transactions/new/page.tsx`

---

# Phase 2: 追加機能開発

## Phase 2-1: 認証機能 🔶 フロントエンド完了

> 詳細設計: AUTH-DESIGN.md 参照

### データベース ⬜
- [ ] Task 2-1-1: invitations テーブル作成
- [ ] Task 2-1-2: handle_new_user 関数更新
- [ ] Task 2-1-3: RLS ポリシー設定

### Supabase設定 ✅（手動）
- [x] Task 2-1-4: メール認証設定
- [x] Task 2-1-5: Google OAuth設定（Google Cloud Console）
- [x] Task 2-1-6: Google OAuth設定（Supabase）
- [x] Task 2-1-7: リダイレクトURL設定

### 型定義・ユーティリティ ✅
- [x] Task 2-1-8: types/index.ts（User, UserRole型）
- [x] Task 2-1-9: lib/permissions.ts（権限チェック関数）

### API ✅
- [x] Task 2-1-10: api/auth.ts（Supabase Auth ラッパー）
- [x] Task 2-1-11: api/invite.ts（招待API）

### Hooks ✅
- [x] Task 2-1-12: hooks/useAuth.ts
- [x] Task 2-1-13: hooks/useUser.ts
- [x] Task 2-1-14: hooks/useLogin.ts
- [x] Task 2-1-15: hooks/useLogout.ts
- [x] Task 2-1-16: hooks/useRegister.ts
- [x] Task 2-1-17: hooks/useInvite.ts

### コンポーネント ✅
- [x] Task 2-1-18: LoginForm.tsx
- [x] Task 2-1-19: RegisterForm.tsx
- [x] Task 2-1-20: GoogleLoginButton.tsx
- [x] Task 2-1-21: LogoutButton.tsx
- [x] Task 2-1-22: AuthGuard.tsx
- [x] Task 2-1-23: RoleGuard.tsx
- [x] Task 2-1-24: UserMenu.tsx
- [x] Task 2-1-25: InviteUserDialog.tsx
- [x] Task 2-1-26: AcceptInviteForm.tsx
- [x] Task 2-1-27: OnboardingForm.tsx

### ページ ✅
- [x] Task 2-1-28: /login ページ
- [x] Task 2-1-29: /register ページ
- [x] Task 2-1-30: /forgot-password ページ
- [x] Task 2-1-31: /accept-invite ページ
- [x] Task 2-1-32: /onboarding ページ
- [x] Task 2-1-33: /auth/callback Route

### 統合 🔶
- [x] Task 2-1-34: Header に UserMenu 組み込み → Header.tsx:34
- [x] Task 2-1-35: ~~レイアウトに AuthGuard 組み込み~~ → ミドルウェアで対応済み
- [ ] Task 2-1-36: 管理者機能に RoleGuard 組み込み → 管理者ページ作成時に対応
- [x] Task 2-1-37: ミドルウェア設定（認証チェック）→ middleware.ts
- [x] AlertDropdown: Header に AlertDropdown 組み込み → Header.tsx:33

---

## Phase 2-2: ダッシュボードKPI ✅ フロントエンド完了

### フロントエンド ✅
- [x] 型定義（types/index.ts）
- [x] API（api/dashboard.ts）
- [x] Hooks（useDashboardKPI, useStockAlerts, useRecentTransactions）
- [x] コンポーネント（KPICard, KPIGrid, StockAlertList, RecentTransactions）
- [x] /dashboard ページ

### データベース ⬜
- [ ] get_dashboard_kpi 関数作成
- [ ] get_stock_alerts 関数作成

---

## Phase 2-3: 発注点アラート ✅ フロントエンド完了

### フロントエンド ✅
- [x] 型定義（types/index.ts）
- [x] API（api/alerts.ts）
- [x] Hooks（useAlertCount, useAlerts）
- [x] コンポーネント（AlertBadge, AlertDropdown, AlertBanner）

### データベース・統合 ⬜
- [ ] get_alert_count 関数作成
- [ ] Header に AlertDropdown 組み込み

---

## Phase 2-4: BOM編集・削除 ✅ 完了

- [x] api/bom.ts（CRUD）
- [x] hooks/useBom.ts
- [x] BomTable, BomEditDialog, BomDeleteDialog, BomActionMenu

---

## Phase 2-5: バーコードスキャン ✅ 完了

- [x] BarcodeScanner, BarcodeScanButton
- [x] ScanResultDialog, ManualEntryFallback
- [x] /scan ページ

---

## Phase 2-6: ロット管理 ✅ 完了

- [x] api/lot.ts, hooks/useLot.ts
- [x] LotTable, LotDetailCard, LotExpiryAlert
- [x] LotHistoryTable, FifoSuggestion
- [x] /lots ページ

---

## Phase 2-7: CSV入出力 ✅ 完了

- [x] api/csv.ts
- [x] CsvExportButton, CsvImportDialog, CsvPreviewTable
- [x] /import-export ページ

---

## 進捗サマリー

### Phase 1（MVP）
| Phase | 状態 | 備考 |
|-------|------|------|
| Phase 0 セットアップ | ✅ 完了 | |
| Phase 1 Atoms | ✅ 完了 | ui/ 17ファイル |
| Phase 2 forms | ✅ 完了 | 各featureに組み込み |
| Phase 3 data-display | ✅ 完了 | 各featureに組み込み |
| Phase 4 Layouts | ✅ 完了 | layouts/ 5ファイル |
| Phase 5 inventory | ✅ 完了 | lot/bom等に分散 |
| Phase 6 transaction | ✅ 完了 | dashboard等に分散 |
| Phase 7 barcode | ✅ 完了 | |
| Phase 7.5 拡張認証 | ✅ ほぼ完了 | RLSはschema.sqlに定義済み |
| Phase 8 ページ | ✅ 完了 | 全ページ実装完了 |

### Phase 2（追加機能）
| Phase | 状態 | 備考 |
|-------|------|------|
| Phase 2-1 認証 | 🔶 フロント完了 | DB設定・統合残り |
| Phase 2-2 KPI | 🔶 フロント完了 | DB関数残り |
| Phase 2-3 アラート | 🔶 フロント完了 | DB関数・統合残り |
| Phase 2-4 BOM編集 | ✅ 完了 | |
| Phase 2-5 バーコード | ✅ 完了 | |
| Phase 2-6 ロット | ✅ 完了 | |
| Phase 2-7 CSV | ✅ 完了 | |

---

## 動作確認 ✅ 2024-12-04

### 今日やったこと
- [x] CLAUDE.md / TASKS.md 更新・整理
- [x] AUTH-DESIGN.md の詳細タスクをTASKS.mdに反映
- [x] Phase 8 完了（/inventory, /transactions ページ作成）
- [x] 統合タスク確認（Header に UserMenu/AlertDropdown 既に組み込み済み）
- [x] Supabase設定確認（Google OAuth設定済み）
- [x] .env.local 作成
- [x] 認証フロー動作確認
- [x] RLS 開発用に無効化（users/tenants）

### 認証フロー
- [x] ダッシュボード表示
- [x] UserMenu表示（右上アバター）
- [x] ログアウト機能
- [x] Googleログイン
- [ ] メール/パスワードログイン → 未テスト
- [ ] 新規登録 → handle_new_user関数が必要

### 環境設定メモ
- Supabase URL: https://onpcgvhchhkqmspldkae.supabase.co
- usersテーブルに手動でユーザー追加（handle_new_user未実装のため）

### 未実装ページ
- [ ] プロフィールページ
- [ ] 設定ページ

---

## 残タスク（優先度順）

### 高優先度（認証・DB）
1. **Task 2-1-2**: handle_new_user 関数作成 → 新規ユーザー自動登録に必要
2. **Task 2-1-1**: invitations テーブル作成
3. **Task 2-1-3**: RLS ポリシー設定（本番用）⚠️ 現在 users/tenants は開発用に無効化中
4. **DB関数**: get_dashboard_kpi, get_stock_alerts, setup_new_tenant

### ~~高優先度（統合）~~ ✅ 完了
5. ~~**Task 2-1-34**: Header に UserMenu 組み込み~~ ✅
6. ~~**Task 2-1-35**: レイアウトに AuthGuard 組み込み~~ ✅ ミドルウェアで対応
7. **Task 2-1-36**: 管理者機能に RoleGuard 組み込み → 管理者ページ作成時
8. ~~**Task 2-1-37**: ミドルウェア設定（認証チェック）~~ ✅
9. ~~**AlertDropdown**: Header に AlertDropdown 組み込み~~ ✅

### 中優先度
10. **Task 7-5**: LabelGenerator（バーコードラベル生成）
11. プロフィールページ作成
12. 設定ページ作成

### ~~Supabase設定（手動）~~ ✅ 完了
- ~~Task 2-1-4: メール認証設定~~ ✅
- ~~Task 2-1-5: Google OAuth設定（Google Cloud Console）~~ ✅
- ~~Task 2-1-6: Google OAuth設定（Supabase）~~ ✅
- ~~Task 2-1-7: リダイレクトURL設定~~ ✅
