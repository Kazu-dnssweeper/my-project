# Changelog

## [0.2.0] - 2025-10-04
### Added
- フィールドマップ対応のログ取り込み（regex / JSON）を追加し、IDNとUTC正規化したデータから `ingest_stats` をレポートへ書き出すようにしました。
- Slack/Webhook と SMTP 通知を実装し、重大度上書きやレポート並び順（`reporting.sort`）の設定を反映する通知サマリを送信できるようにしました。
- Demo/CI 向けに 10MB 超の gzip スモークデータを含むサンプル出力（`demo-output/`）を生成する流れを整備し、通知の動作を実機で確認しやすくしました。

### Changed
- `scripts/preflight.py` が fieldmap の静的検証とレポートディレクトリの書き込みチェックを行い、設定不備を早期に検知できるようにしました。
- `config_loader`／Markdown レポートの日付フォーマットを `reporting.date_format` に統一し、英語レポートでも Heuristic 情報（例: MX-NXDOMAIN）を明示表示するようにしました。
- サンプル設定 (`config/fieldmap/*.yaml` / `config/settings.yaml`) を再編し、IDN を含むログ取り込み例や通知設定の下書きを追加しました。

### Security
- オンラインAXFRガードを `dns.zone.allowed_online_axfr` で許可ゾーンに限定し、CI からの 10MB 超スモークと同様に誤用を防ぐようにしました。

## [0.1.0] - 2025-10-03
### Added
- i18n: `reporting.language` と `reporting.date_format`、`runtime.timezone` で内部UTC・出力TZ変換に対応。
- IDN: 内部はPunycode/出力はUnicodeで扱い、`tests/test_idn.py` で往復を検証。
- 未使用検知: CNAME終端の内部解決で差集合の精度を向上し、`usage_index` をUTC集約に統一。
- AXFRガード: `dns.zone.allowed_online_axfr` による自ゾーン限定許可と CLI でのオンライン判定切替を実装。
- Demo/CI: `demo.yml` と `scripts/generate_demo.py` で実環境なしのデモ出力を自動生成。

### Changed
- SPF参照回数の計数ロジックを連結処理＋サニタイズに刷新。
- レポートレンダラをロケール対応・Unicode表示に更新し、言語と書式を設定可能に。

### Security
- オンラインAXFRは許可リストにないゾーンや未承認の実行を拒否し、再設定手順をメッセージで案内。
