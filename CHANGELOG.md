# Changelog

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
