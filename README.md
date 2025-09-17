# DNSweeper MVP

シンプルな DNS ゴミレコード検出ツールを個人開発で仕上げる Next.js プロジェクトです。Next.js 15 / Supabase / Stripe / Tailwind CSS / Cloudflare API を核に、不要な DNS レコードを洗い出す MVP を構築します。

## ドキュメント
- [要件定義](docs/mvp/requirements.md)
- [開発計画](docs/mvp/delivery-plan.md)
- [進捗ログ](docs/mvp/progress-log.md)
- [本番前技術チェックリスト](docs/mvp/technical-checklist.md)

## 必須セットアップ
1. `.env.local` を作成し、`.env.example` を参考に **実際のキーで** 全ての環境変数を設定する。
2. Supabase CLI をインストールし、ログイン済みであることを確認する。
3. 以下のマイグレーションを本番／ステージ環境に適用する。
   ```bash
   supabase db push --project-ref <YOUR_SUPABASE_PROJECT_REF>
   ```
4. 型定義を最新化する（Supabase CLI 0.23 以上推奨）。
   ```bash
   npm run supabase:types
   ```
5. Cloudflare API トークン（Zone:Read, DNS:Read）が `.env.local` に設定されていることを確認する。
6. Stripe で以下を準備し、環境変数に反映する。
   - Checkout 用 Price ID（サブスク）
   - `STRIPE_WEBHOOK_SECRET`（エンドポイント `/api/subscription/webhook` を登録）

## ローカル開発
1. 依存パッケージをインストール
   ```bash
   npm install
   ```
2. 開発サーバーを起動
   ```bash
   npm run dev
   ```
3. ブラウザで [http://localhost:3000](http://localhost:3000) を開いて動作を確認。

主要なページは `app/` 配下で編集できます。トップページは `app/page.tsx`、アプリ本体は `app/app/` 以下に配置されています。

## デプロイ・運用チェックリスト
- Vercel プロジェクトを作成し、上記環境変数をすべて投入する。
- `supabase/migrations` を本番に適用済みか確認。
- Stripe Webhook（イベント: `checkout.session.completed`, `customer.subscription.*`）を `/api/subscription/webhook` に向けて接続し、ログが届くことを確認。
- Cloudflare API トークンを「読み取り専用」に限定し、不要な権限がないか再チェック。
- Supabase RLS が想定どおり動作するか、匿名権限とサービスロール権限でテストする。
- `npm run lint` / `npm run build` が本番用環境変数で成功することを確認する。

## 開発時のメモ
- Supabase 型は `supabase/types.ts` からアプリ側に供給しています。CLI の `supabase gen types` で随時再生成してください。
- Cloudflare ゾーンは API から自動解決しますが、レート制限緩和のために `p-limit(5)` で同時実行数を制御しています。
- Stripe は現状 Pro プランのみを想定。Price ID 変更時は `.env` とダッシュボード文言を更新してください。

進捗やタスクの整理は `docs/mvp/progress-log.md` に記録し、要件との齟齬がないか随時確認してください。
