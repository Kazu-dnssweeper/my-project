# PartStock - 電子部品製造業向けクラウド在庫管理システム

## プロジェクト概要

電子部品製造業（従業員100人以上の中堅企業）向けのシンプルな在庫管理SaaS。
「zaicoより製造業機能が充実し、TECHSより圧倒的にシンプル・低価格」を狙う。

### ターゲット
- 電子部品製造業（コネクタ、コンデンサ、抵抗器、半導体等）
- 従業員100〜500人の中堅製造業
- Excel/紙管理からの脱却を目指す企業

### 主要機能
1. **在庫マスタ管理** - 部品情報のCRUD
2. **入出庫管理** - 入庫/出庫/移動の記録
3. **ロット管理** - ロット番号追跡、FIFO
4. **簡易BOM管理** - 2〜3階層の親子関係
5. **バーコード/QR対応** - スマホカメラ読み取り
6. **発注点アラート** - 在庫閾値通知

---

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| フロントエンド | Next.js 14 (App Router) + TypeScript |
| UIライブラリ | Tailwind CSS + shadcn/ui |
| バックエンド | Supabase (PostgreSQL + Auth + Storage) |
| ホスティング | Vercel |
| 状態管理 | Zustand |
| フォーム | React Hook Form + Zod |
| テスト | Vitest + Testing Library |

---

## ディレクトリ構成

```
src/
├── app/                      # Next.js App Router
│   ├── (auth)/               # 認証グループ（login, register）
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/          # ダッシュボードグループ
│   │   ├── dashboard/page.tsx
│   │   ├── inventory/page.tsx
│   │   ├── inventory/[id]/page.tsx
│   │   ├── transactions/page.tsx
│   │   ├── transactions/new/page.tsx
│   │   ├── bom/page.tsx
│   │   └── layout.tsx
│   ├── api/                  # API Routes
│   └── layout.tsx
├── components/               # 共通UIコンポーネント
│   ├── ui/                   # Atoms（shadcn/ui）
│   ├── forms/                # Molecules（フォーム部品）
│   ├── data-display/         # Molecules（表示部品）
│   └── layouts/              # Templates（レイアウト）
├── features/                 # 機能別コンポーネント
│   ├── inventory/            # 在庫管理
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   ├── types/
│   │   └── index.ts
│   ├── transaction/          # 入出庫
│   ├── bom/                  # BOM管理
│   ├── lot/                  # ロット管理
│   └── barcode/              # バーコード
├── hooks/                    # 共通カスタムフック
├── lib/                      # ユーティリティ
│   ├── supabase/
│   │   ├── client.ts         # ブラウザ用クライアント
│   │   ├── server.ts         # サーバー用クライアント
│   │   └── middleware.ts
│   └── utils/
├── types/                    # 共通型定義
└── stores/                   # Zustand ストア
```

---

## 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# テスト
npm run test

# 型チェック
npm run type-check

# Lint
npm run lint

# Supabase型生成
npm run db:types
```

---

## 開発フェーズ（ボトムアップ）

### Phase 0: セットアップ（現在）
- [x] プロジェクト構成定義
- [ ] Next.js プロジェクト作成
- [ ] Supabase プロジェクト作成
- [ ] shadcn/ui 導入
- [ ] 基本設定（ESLint, Prettier, TypeScript）

### Phase 1: Atoms（ui/）
- [ ] Button, Input, Label
- [ ] Badge, Card, Select
- [ ] Checkbox, Dialog, Toast
- [ ] Skeleton, Spinner

### Phase 2: Molecules（forms/, data-display/）
- [ ] FormField, SearchBox, SelectField
- [ ] NumberInput, DatePicker, ComboBox
- [ ] DataTable, KPICard, AlertCard
- [ ] EmptyState, StatusBadge, Pagination

### Phase 3: Layouts
- [ ] AppShell, Header, SideNav
- [ ] PageHeader, AuthLayout

### Phase 4: Feature - inventory/
- [ ] types/inventory.ts
- [ ] api/inventory.ts
- [ ] hooks/useInventory.ts
- [ ] InventoryTable, InventoryForm
- [ ] InventoryFilters, InventoryCard

### Phase 5: Feature - transaction/
- [ ] types/transaction.ts
- [ ] api/transaction.ts
- [ ] hooks/useTransaction.ts
- [ ] TransactionForm, TransactionTable
- [ ] TransactionTypeSelect, QuantityInput

### Phase 6: Feature - barcode/
- [ ] BarcodeScanner（カメラ読み取り）
- [ ] BarcodeInput, LabelGenerator
- [ ] LabelPreview, ScanHistory

### Phase 7: Feature - lot/, bom/
- [ ] LotTable, LotForm, LotSelect
- [ ] BomTree, BomEditor, BomTable

### Phase 8: ページ組み立て
- [ ] 認証ページ
- [ ] ダッシュボード
- [ ] 在庫一覧・詳細
- [ ] 入出庫登録・履歴
- [ ] BOM管理

---

## データベーススキーマ

### tenants（テナント）
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### users（ユーザー）
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  role VARCHAR(20) DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### categories（カテゴリ）
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  name VARCHAR(100) NOT NULL,
  parent_id UUID REFERENCES categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### warehouses（倉庫）
```sql
CREATE TABLE warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  name VARCHAR(100) NOT NULL,
  location VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### items（部品マスタ）
```sql
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  item_code VARCHAR(50) NOT NULL,
  name VARCHAR(200) NOT NULL,
  model_number VARCHAR(100),
  category_id UUID REFERENCES categories(id),
  unit VARCHAR(20) NOT NULL DEFAULT '個',
  safety_stock DECIMAL(15,3),
  reorder_point DECIMAL(15,3),
  lead_time_days INTEGER,
  location VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, item_code)
);
```

### inventory（在庫）
```sql
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  item_id UUID REFERENCES items(id) NOT NULL,
  warehouse_id UUID REFERENCES warehouses(id) NOT NULL,
  lot_number VARCHAR(50),
  quantity DECIMAL(15,3) NOT NULL DEFAULT 0,
  received_date DATE,
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### transactions（取引履歴）
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  inventory_id UUID REFERENCES inventory(id) NOT NULL,
  type VARCHAR(20) NOT NULL, -- IN, OUT, MOVE
  sub_type VARCHAR(30),
  quantity DECIMAL(15,3) NOT NULL,
  user_id UUID REFERENCES users(id) NOT NULL,
  note TEXT,
  transacted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### bom（部品表）
```sql
CREATE TABLE bom (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) NOT NULL,
  parent_item_id UUID REFERENCES items(id) NOT NULL,
  child_item_id UUID REFERENCES items(id) NOT NULL,
  quantity DECIMAL(15,3) NOT NULL,
  version VARCHAR(20) DEFAULT '1.0',
  effective_from DATE,
  effective_to DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## コンポーネント設計規約

### 命名規則
- コンポーネント: PascalCase（`InventoryTable.tsx`）
- フック: camelCase、use接頭辞（`useInventory.ts`）
- 型: PascalCase（`Item`, `Transaction`）
- ファイル: kebab-case（`data-table.tsx`）

### Props設計
```typescript
// 良い例：明確な型定義
interface InventoryTableProps {
  items: Item[];
  isLoading?: boolean;
  onRowClick?: (item: Item) => void;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
}

// 悪い例：any, 曖昧な型
interface BadProps {
  data: any;
  callback: Function;
}
```

### フック設計
```typescript
// データ取得フックのパターン
function useInventory(id: string) {
  return useQuery({
    queryKey: ['inventory', id],
    queryFn: () => fetchInventory(id),
  });
}

// ミューテーションフックのパターン
function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}
```

---

## 環境変数

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## よく使うコマンド

```bash
# shadcn/uiコンポーネント追加
npx shadcn@latest add button input label card dialog

# Supabase CLI
npx supabase login
npx supabase init
npx supabase db push
npx supabase gen types typescript --local > src/types/database.ts

# 新しいFeature作成
mkdir -p src/features/[name]/{components,hooks,api,types}
```

---

## 注意事項

1. **マルチテナント**: 全テーブルに`tenant_id`があり、RLSで分離
2. **型安全**: `any`禁止、Zodでバリデーション
3. **エラーハンドリング**: try-catchで適切に処理
4. **ローディング状態**: Skeletonで表示
5. **オフライン対応**: PWA化はPhase 2以降
