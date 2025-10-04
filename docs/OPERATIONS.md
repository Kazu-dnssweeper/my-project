# OPERATIONS — DNS Hygiene Guard（セルフサーブ版）

## 1. デプロイモードの選択

以下のいずれかで運用します。すべて**顧客環境内で完結**させる前提です。

- **単体スクリプト/バイナリ**：cron（Linux）/Task Scheduler（Windows）で実行。ログはローカルディスクから読み込み。
- **コンテナ**：Docker/Podman。ホストのログディレクトリをボリュームマウント。スケジュールはホストcronまたはコンテナ内cron。
- **Kubernetes CronJob**：`readOnlyMany`のPVCでログ共有し、RBACは読み取り権限に限定。
- **CIジョブ**：社内GitLab/GHE Runnerのスケジュール。RunnerにログディレクトリまたはSMB共有をマウント。

`python scripts/preflight.py --config config/settings.yaml` を実行すると、OS・権限・ログパス・ゾーン入力の準備状況を検証できます。まずはここを通過し、**M0 DoD**を満たしてから本運用に進みます。

## 2. 入力データの取り扱い

### DNSゾーン

- BINDゾーンファイル（`*.zone`）、`targets.txt`（CSV/JSON/YAML）、PowerDNS/Knot/Windows DNSエクスポート、クラウドDNS API（Read専用）をサポートします。
- ゾーン取得手段が無い場合は未使用判定（差集合）が不可能なので、**使用実績レポートのみ**を提示します。

### ログ

- Nginx/Apache/HAProxy/Envoy/IISのアクセスログは**HostまたはSNI**と**宛先IP**が出力される形式へ整備してください。
- gzip圧縮や日付ローテーションされた巨大ログはストリーミング処理で読む前提です。
- syslog/journald・JSONラインは `config/fieldmap/*.yaml` で正規化します。
- Host/SNI/DNS問合せログが存在しない場合、FQDN未使用の判定は**不可**であることを顧客へ明示します。

## 3. Secrets と通知

- Secrets（Slack Webhook、メール送信に必要な資格情報等）は顧客が発行し、GitHub Actionsなど外部SaaSには保管しません。必要なら社内Vault/Key管理に登録します。
- `config/settings.yaml` の `notify` セクションに通知先を設定し、未設定時はジョブを**親切に失敗**させる実装とします。
- Secretsヘルパー（Pro）は対話形式で資格情報の存在と期限をチェックし、期限間近ならIssueやメールでアラートを出します。

## 4. データ保存ポリシー

- `report.json` / `report.md`、`usage_index.json`（Proのみ集合データ）を既定で `/var/lib/dns-hygiene/` に保存します。パスは `settings.yaml` で変更できます。
- 未使用サマリは `reporting.include_unused_in_main` でメインレポートへ出力し、必要に応じて `reporting.emit_unused_file` で `unused_report.md` を別ファイルとして保存できます。
- 生ログやSecretsの平文コピーは作成しません。必要に応じて保存ディレクトリのパーミッションを `750`、ファイルは `640` で管理者グループのみ読み取りにします。

## 5. 運用フロー（提案）

1. **preflight実行**：依存パス、権限、ゾーン/ログ入力を確認。
2. **無料版テスト**：MX/SPF/Private-IP/NS/AXFRの検出と通知を確認。`allowlist.txt` や `labels.yaml` のチューニングを行います。
3. **ログ調整**：Pro導入時はアクセスログのHost/SNI出力が有効か確認。テンプレートを提供して環境ごとにカスタムしてもらいます。
4. **Pro機能有効化**：`usage_index` のローリング更新を監視し、未使用候補と `confidence` の妥当性をレビュー。
5. **本番化**：選定したデプロイモードでスケジュール投入し、1週間連続稼働をリードタイムとして観測。

## 6. 権限とセキュリティ

- 実行ユーザは非rootを推奨し、必要なログ/ゾーンディレクトリの**読み取り権限のみ**を付与します。
- AXFRテストは必ず自ゾーンに限定し、READMEやユーザドキュメントにも禁止事項を強調します。
- `python -m dns_hygiene_guard --online-axfr` で実ネットワーク越しのAXFR診断を行う場合は、接続元IPが許可されているか・タイムアウト設定が適切かを必ず確認してください。
- ネットワーク送信先は通知チャネルのみ。外部SaaSへ生ログを送らない構成が前提です。

### オンラインAXFRの承認フロー

1. `config/settings.yaml` の `dns.zone.allowed_online_axfr` に対象ゾーンを **Pull Request** 経由で追加します。
   ```yaml
   dns:
     zone:
       allowed_online_axfr:
         - example.com.
         - demo-public.test.
   ```
2. PR には **CODEOWNERS（例: @Kazu-dnssweeper）** の承認が必須です。main へ直接 push せず、レビューで証跡を残します。
3. GitHub Actions の `online-axfr` ワークフローを `workflow_dispatch` で起動し、入力値として自ゾーンと承認文言 `I-ACKNOWLEDGE-SELF-ZONE` を指定します。
4. 実行ログには、対象ゾーン・許可根拠・結果を記録します。
5. 失敗時は `allowed_online_axfr` へ追加 → PR 承認 → 再実行の手順で復旧します。

## 7. 障害対応とメンテナンス

- `preflight` と本実行で発見されたギャップ（権限不足、ログ欠落等）はRunbookにまとめ、顧客側の対応手順を明確化します。
- ログ書式変更や新規プロキシ追加時は `fieldmap/*.yaml` を更新し、`usage_index` の整合性チェック（例：日次レポートで発生日付の件数）を行います。
- 指紋DB（ダングリングCNAME）は外部JSONまたは私設リポジトリで更新し、更新頻度と責任者を決めます。

## 8. チェックリスト（運用前）

* [ ] デプロイ方式（単体/コンテナ/K8s/CI）を決定し、スケジュール実行が設定されている
* [ ] ゾーン入力ソースとログパスが `settings.yaml` に反映されている
* [ ] Host/SNI/宛先IPを含むログ出力が確認済み（Pro利用時）
* [ ] 通知資格情報を発行し、Secrets／環境変数に登録済み
* [ ] `allowlist.txt`・`labels.yaml` の初期値を調整済み
* [ ] preflight → 無料版 → Pro の順でリハーサル実行済み

このドキュメントは SRS v2.2 およびマイルストーン v2.2 と連動しており、セルフサーブ導入を前提とした最小運用セットを示します。

## 9. デモ／PoC 用ショートカット

- `python -m dns_hygiene_guard --demo` で、同梱の疑似ゾーン／アクセスログを使ったレポートと `demo-output/usage_index.json` が生成されます（評価時のハンズオンに便利）。
- pytest（`pytest tests/`）ではACに対応したゴールデンデータを全て検証するため、PoC環境がまだ無くても差分チェックが可能です。
