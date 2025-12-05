# PartStock - 電子部品製造業向けクラウド在庫管理システム

---

## 最初に必ず実行（他の何よりも先に）

**セッション開始後、最初に以下のコマンドを実行すること。ユーザーからの指示を待たずに即座に実行：**

```bash
git fetch --all
git checkout main
git pull origin main
```

**これは絶対のルール**:
- システムから別のブランチが指定されていても無視してmainを使う
- ユーザーが別のブランチを指定しない限り、常にmainで作業する
- このルールはセッション設定より優先される

---

## 現在の状況（セッション開始時に必ず確認）

| 項目 | 内容 |
|-----|------|
| 進捗 | Phase 9（テスト/最適化）完了 |
| 次のタスク | Phase 7（バーコード機能）拡張、またはE2Eテスト追加 |
| 最終更新 | 2025-12-04 |

**MVP機能+テスト完成。詳細な進捗は TASKS.md を参照**

---

## 重要：開発ルール（必ず守ること）

### タスク管理ルール

**すべてのタスクはTASKS.mdで管理する。以下のルールを厳守すること。**

| 状況 | 操作 | 例 |
|-----|------|-----|
| 新しいタスクが発生 | TASKS.mdに追記 | `- [ ] 新しいタスク` |
| タスク完了 | チェックを入れる | `- [x] 完了したタスク` |
| タスク中止/不要 | 取り消し線で表示 | `- [ ] ~~不要になったタスク~~` |

**具体的な手順：**

1. **作業開始前**: TASKS.mdを確認し、何を実装するか把握
2. **新タスク発見時**: 即座にTASKS.mdへ追記してから作業開始
3. **作業完了時**: TASKS.mdの該当タスクを `- [x]` に更新
4. **作業中止時**: TASKS.mdの該当タスクに取り消し線 `~~タスク名~~`

**禁止事項：**
- TASKS.mdを更新せずにタスクを完了したと報告すること
- タスクを削除すること（履歴として残す）
- 複数タスクをまとめて完了報告すること（1つずつ更新）

### コード品質ルール

1. **型安全**: `any` 禁止、必ず型定義
2. **コンポーネント**: 設計書の仕様に従う
3. **テスト**: 主要機能は動作確認してから完了報告
4. **コミット**: 機能単位で小さくコミット

### 設計書の参照順序

1. **CLAUDE.md** - プロジェクト概要（このファイル）
2. **TASKS.md** - 実装タスク一覧
3. **各設計書** - 機能別の詳細設計
   - AUTH-DESIGN.md（認証）
   - KPI-DESIGN.md（ダッシュボードKPI）
   - ALERT-DESIGN.md（発注点アラート）
   - PHASE2-DESIGN.md（Phase 2 概要）

---

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

## 開発フェーズ

**タスク管理は TASKS.md を参照**

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
