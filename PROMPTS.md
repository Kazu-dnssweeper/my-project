# Claude Code への指示テンプレート

このファイルには、Claude Codeに渡すプロンプトのテンプレートを記載しています。
コピペして使ってください。

---

## 🚀 プロジェクト開始時

```
このプロジェクトは PartStock という電子部品製造業向けの在庫管理SaaSです。

CLAUDE.md を読んで、プロジェクトの概要と設計方針を理解してください。
TASKS.md を読んで、開発タスクの全体像を把握してください。

まず setup.sh を実行してプロジェクトをセットアップしてください。
```

---

## 📦 Phase 0: セットアップ

```
Task 0-1 から 0-6 を順番に実行してください。
CLAUDE.md の技術スタックとディレクトリ構成に従ってセットアップしてください。
```

---

## 🎨 コンポーネント作成

### 単一コンポーネント作成
```
TASKS.md の Task 2-1 (FormField) を実装してください。

要件:
- src/components/forms/form-field.tsx に作成
- Label + children + エラーメッセージを表示
- required の場合は * マークを表示
- Tailwind CSS でスタイリング
```

### Feature全体の作成
```
TASKS.md の Phase 5 (inventory Feature) を全て実装してください。

CLAUDE.md のディレクトリ構成に従って:
1. types/index.ts - 型定義
2. api/index.ts - Supabase API関数
3. hooks/useInventory.ts - カスタムフック
4. components/ - 各コンポーネント

の順で作成してください。
```

---

## 🗄️ データベース

```
supabase/schema.sql の内容をSupabaseのSQLエディタで実行してください。
その後、Supabaseの型を生成してください:

npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

---

## 📄 ページ作成

```
在庫一覧ページを作成してください。

ファイル: src/app/(dashboard)/inventory/page.tsx

使用するコンポーネント:
- PageHeader (タイトル: "在庫一覧", 新規登録ボタン)
- InventoryFilters
- InventoryTable

データ取得は useItems フックを使用してください。
```

---

## 🐛 バグ修正

```
[エラー内容を貼り付け]

上記のエラーを修正してください。
該当ファイルを確認し、原因を特定して修正してください。
```

---

## ✨ 機能追加

```
バーコードスキャン機能を追加してください。

要件:
- @zxing/browser を使用
- スマホカメラでCode128, QRコードを読み取り
- 読み取り成功時に onScan コールバックを呼び出し
- エラー時は onError コールバックを呼び出し

ファイル: src/features/barcode/components/barcode-scanner.tsx
```

---

## 🧪 テスト作成

```
InventoryForm コンポーネントのテストを作成してください。

テストケース:
1. 必須フィールド未入力でエラー表示
2. 有効な入力で onSubmit が呼ばれる
3. initialData がある場合、初期値がセットされる
4. isSubmitting 中はボタンが無効

ファイル: src/features/inventory/components/__tests__/inventory-form.test.tsx
```

---

## 📋 進捗確認

```
現在の実装状況を確認してください。

TASKS.md のチェックリストに基づいて:
1. 完了しているタスク
2. 次に着手すべきタスク
3. 未実装のタスク

を報告してください。
```

---

## 💡 Tips

### 複数ファイルを一度に作成したい場合
```
以下のファイルをまとめて作成してください:
- src/features/lot/types/index.ts
- src/features/lot/api/index.ts
- src/features/lot/hooks/useLot.ts
- src/features/lot/components/lot-table.tsx
- src/features/lot/index.ts

CLAUDE.md の設計規約に従ってください。
```

### 既存コードのリファクタリング
```
src/features/inventory/components/inventory-table.tsx をリファクタリングしてください。

改善点:
- コンポーネントを小さく分割
- カスタムフックを抽出
- 型を厳密に
```

### デバッグ
```
npm run dev を実行して、http://localhost:3000/inventory にアクセスしたところ、
以下のエラーが発生しました:

[エラーログを貼り付け]

原因を調査して修正してください。
```
