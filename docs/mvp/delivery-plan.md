# DNSweeper MVP 開発計画

## 1. 成功基準とゴール
- コア機能である Cloudflare ドメインの DNS ゴミ検出（5種）を正確に行い、削除推奨レポートを返せる。
- Supabase 上にドメインとスキャン履歴を保存し、ユーザーが履歴を参照できる。
- ランディング〜設定までの 5 ページ構成で、無料/有料プランに誘導できる。
- Stripe サブスクリプション導線を MVP 水準で完了させる。

## 2. アーキテクチャ指針
- Next.js App Router を採用し、`/app` 配下を保護ルート（Supabase Auth）として実装。
- UI は Tailwind CSS + shadcn/ui をベースに、可能な限り既存コンポーネントを利用。
- API Route `/api/dns/scan` で Cloudflare → 解析 → Supabase 保存までを実施。
- 外部連携は Cloudflare API のみ、Stripe は決済フローと Webhook の最小実装。
- React Query を使い、スキャン結果・履歴のフェッチをキャッシュしつつ状態管理を簡素化。

## 3. マイルストーン
1. **Phase 1: 基礎構築（Week 1-4）**
   - Next.js プロジェクト雛形 + Tailwind セットアップ
   - Supabase プロジェクト設定（Auth/DB マイグレーション）
   - Cloudflare API 連携と DNS レコード取得ユーティリティ
   - 検出ロジック v1（TypeScript サービス層）

2. **Phase 2: 機能完成（Week 5-8）**
   - ダッシュボード UI・スキャン実行画面
   - スキャン結果テーブル・詳細モーダル
   - スキャン履歴ページ & Supabase への保存処理
   - 認証（ログイン/ログアウト）と保護ルート

3. **Phase 3: 収益化準備（Week 9-12）**
   - Stripe 決済（Checkout, Webhook, Supabase 反映）
   - プライシング表示とプラン選択導線
   - ドキュメント整備・軽微なパフォーマンス調整
   - ローンチ前 QA と計測設定（UptimeRobot, Sentry）

## 4. タスク分解
- **セットアップ**: Next.js 初期化、リント/フォーマッタ設定、環境変数テンプレート。
- **データレイヤー**: Supabase スキーマ & 型生成、RLS ルール、サーバー側ユーティリティ。
  - `supabase/migrations` をベースに `supabase db push` で環境反映。
  - `npm run supabase:types` で `supabase/types.ts` を再生成し型を同期。
- **ドメイン検出ロジック**: 各チェック関数実装、並列制御、エラー処理、ユニットテスト。
- **API**: `/api/dns/scan`, `/api/subscription/create-checkout`, Stripe Webhook。
- **UI/UX**: ランディング、ダッシュボード、スキャン画面、履歴、設定。
- **課金**: Stripe Checkout ボタン、Webhook ハンドラ、Subscription 状態同期。
- **運用準備**: エラーログ（Sentry）、稼働監視（UptimeRobot）、FAQ 雛形。

## 5. 進捗管理の進め方
- `docs/mvp/progress-log.md` で週次ログを残し、完了/保留タスクを明確化。
- GitHub Issues / Projects を利用し、マイルストーンとタスクを紐付け。
- 毎週末に「完了」「未完」「ブロッカー」「次週予定」を整理。
- 手が止まった場合は要件ドキュメントに立ち返り scope を再確認。

## 6. リスクと対策（重点）
- **Cloudflare Rate Limit**: `p-limit` で同時実行 5 件に制限、失敗時は指数バックオフ。
- **誤検出**: 判定結果に confidence と disclaimer を明示し、削除はユーザー判断とする。
- **個人開発の時間不足**: 毎週最低 15h の作業スロット確保、MVP 外要件は backlog へ退避。
- **Stripe 審査遅延**: 開発早期にアカウント準備、テストキーで実装を先行。

## 7. 参考リソース
- Cloudflare API Docs: https://api.cloudflare.com/
- Supabase Docs: https://supabase.com/docs
- Stripe Docs: https://stripe.com/docs

この計画に沿って段階的に開発し、常に MVP 要件との整合性を確認する。
