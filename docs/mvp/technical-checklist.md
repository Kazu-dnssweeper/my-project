# 本番前技術チェックリスト

以下はリリース前に完了すべき技術的タスクのチェックリストです。ステージ／本番それぞれで実施し、完了状況を記録してください。

## Supabase
- [ ] `supabase db push --project-ref <PROJECT_REF>` を実行し、`supabase/migrations/0001_init.sql` の schema/RLS を適用した
- [ ] 適用後に `npm run supabase:types` を実行し、`supabase/types.ts` が最新であることを確認した（差分があればコミット）
- [ ] `supabase` ダッシュボードで `domains` / `scans` / `subscriptions` テーブルの RLS が有効か確認した
- [ ] `anon` キーで `domains` の読み書きが適切に制限されていることを PostgREST or REST 接続で検証した
- [ ] `service` キーで `scans` への insert が可能であることを検証した（`curl` などを利用）

## 環境変数
- [ ] `.env.local`（ローカル）と Vercel の環境変数に以下を設定した
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_KEY`
  - `CLOUDFLARE_API_TOKEN`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_PRICE_ID`
  - `STRIPE_WEBHOOK_SECRET`
- [ ] 上記を設定した状態で `npm run lint` `npm run build` が成功することを確認（CI での実行を推奨）

## Cloudflare
- [ ] DNS 読み取り専用トークン（Zone:Read, DNS:Read）を発行し、API で対象ゾーンのレコードが取得できることを確認
- [ ] レート制限対策（`p-limit(5)`）で問題ないか、1ドメインあたりのレコード数が多いケースをテスト

## Stripe
- [ ] Pro プラン用 Price ID を作成し、`STRIPE_PRICE_ID` に設定
- [ ] Stripe Dashboard で Checkout 成功 → `subscriptions` テーブルへレコードが upsert されることを確認
- [ ] Stripe CLI 等で webhook (`checkout.session.completed`, `customer.subscription.*`) を `/api/subscription/webhook` に送信し、HTTP 200 が返ることを確認

## アプリケーション動作
- [ ] ログイン → ドメインスキャン → 結果表 → 履歴ダウンロード → Pro へアップグレード → 解約 のフローを手動テスト
over both staging & production
- [ ] フリープラン上限（5スキャン/1ドメイン）の制御方針を決定し、必要であれば実装
- [ ] エラーケース（無効な Cloudflare Token、Stripe 決済失敗、Supabase 401）でユーザーに表示されるメッセージを確認
- [ ] モバイル / タブレットで UI を確認し、主要画面の崩れがないかチェック

## モニタリング / 運用
- [ ] Sentry DSN を設定し、意図的にエラーを発生させて通知を確認
- [ ] UptimeRobot で `/` もしくは `/app` の監視を登録
- [ ] Stripe / Supabase / Cloudflare の各ログを確認できるようにブックマーク

完了済みの項目は日付や実施者、検証方法を追記しておくと、次回リリース時に再利用しやすくなります。
