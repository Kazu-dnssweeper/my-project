# DNS Hygiene Guard

自分が管理権限を持つDNSゾーンの健全性を日次でチェックし、危険なレコードや未使用候補をレポートする自動化ツールです。実装の詳細要件は [`SRS.md`](SRS.md) を参照してください。
English summary is available in [`README.en.md`](README.en.md).

## 言語サポート方針

- 既定では日本語UI/ドキュメントを提供します。
- **海外顧客向け対応を視野に入れ、英語UI/レポート/ドキュメントの切り替えを実装範囲に含めます。**
- 多言語化の要件と優先度はマイルストーン計画に追記し、将来的には `docs/` 以下に英語版ガイドを整備する予定です。

## 現状の進捗

- ✅ M0〜M2：静的4本（MX/SPF/Private IP/NS）＋AXFRチェックを実装し、`tests/fixtures` 内のゴールデンデータで回帰テスト化。
- ✅ Proコア：ログ取り込み（Nginxデモ）、usage_indexローリング、未使用FQDN/IP検知、ダングリングCNAME検知（指紋＋HTTPモック）。
- ✅ `python -m dns_hygiene_guard --demo` でオフライン完結のレポート＆`usage_index.json`を生成。
- ✅ GitHub Actions はデモモードを既定にし、CIで `pytest` + `ruff` を実行。
- ⬜️ 実環境ログ／ゾーンでの最終調整、英語UI/ドキュメントの本実装（マイルストーンM6以降）。

> **注意**：AXFR などの診断は必ず自分が管理するゾーンでのみ実行してください。他者ドメインへの適用は禁止です。

## ディレクトリ構成（抜粋）

```
.
├── SRS.md / MILESTONES.md / README.md
├── kickoff.yaml                # M0→M2着手用の入力テンプレート
├── config/                     # 本番用の設定テンプレート
├── docs/OPERATIONS.md
├── src/dns_hygiene_guard/
│   ├── demo/data/              # ゾーン/ログ/HTTPフィクスチャ一式
│   ├── logs/                   # usage_index維持ロジック
│   ├── rules/                  # 静的＆Pro検知
│   └── ...
├── tests/                      # ACに対応したpytest
├── examples/, scripts/         # 今後の配布テンプレート置き場
└── .github/workflows/
    ├── ci.yml
    └── dns-guard.yml           # デモモードでのサンプル実行
```

## 開発の始め方

1. Python 3.11 以上で仮想環境を作成します。
2. `pip install -e .[dev]` で開発依存をインストールします。
3. `pytest` と `ruff check .` でベースラインのCIと同じ検証を行えます。

マイルストーンごとの詳しい進行計画は [`MILESTONES.md`](MILESTONES.md) を参照してください。
リリース履歴は [`CHANGELOG.md`](CHANGELOG.md) にまとめています。

## デモ実行（オフライン）

疑似ゾーン・アクセスログ・HTTPレスポンスを同梱しているため、ネットワーク接続なしでフルレポートを確認できます。

```bash
python -m dns_hygiene_guard --demo
cat demo-output/report.md
dng --demo   # CLIラッパ（pyproject経由）
```

`demo-output/usage_index.json` には30日ローリングの使用状況が書き出されます（Pro機能の検証用）。

## CI / GitHub Actions（デモ）

- `.github/workflows/ci.yml` で `pytest` と `ruff check` を実行し、静的分析と回帰テストを担保しています。
- `.github/workflows/demo.yml` は `python scripts/generate_demo.py` を用いてデモレポートを生成し、`demo-output/` をアーティファクトとして保存します。
- `.github/workflows/online-axfr.yml` は **手動実行専用** のテンプレートです。`dns.zone.allowed_online_axfr` に登録済みのゾーン名だけが `--online-axfr` を許可され、確認フレーズを入力した場合のみ動きます。

## テスト

```bash
pytest              # SRS v2.2 のACに対応した回帰テスト
ruff check .        # コードスタイル＆バリデーション
```

CIでも同じコマンドを実行します。フィクスチャは `src/dns_hygiene_guard/demo/data/` に集約されているため、実環境がなくても差分検証が可能です。

### 補助スクリプト

- `python scripts/preflight.py --config config/settings.yaml` でログパス/ゾーンファイル/レポートディレクトリの存在・権限をチェックできます。
- `python -m dns_hygiene_guard --online-axfr` を指定すると、TXTマーカーに加えて実際のAXFRを試行します（network許可がある場合のみ）。

## キックオフ（入力メモ）

`kickoff.yaml` は要件ヒアリング時に埋める最小項目のテンプレートです。ゾーン入力モード／通知先／デプロイ方式／Pro用ログ準備の4点を決めれば、M0→M2を一気に進められます。

### ロケール・時刻と言語

- `config/settings.yaml` の `reporting.language` と `reporting.date_format` でレポートの言語と日時フォーマットを設定できます。
- `runtime.timezone` はログ解析・レポート生成時に採用するタイムゾーンです（内部処理はUTCで保持し、出力だけ指定TZに変換）。
- デフォルトは日本語/UTCです。英語に切り替えるとヘッダー・項目名が英語になり、日付も指定フォーマットで表示されます。

### ログフィールドの正規化

- `config/fieldmap/` に **regex / json** ベースのマッピングを置くと、アクセスログから `fqdn` / `ip` / `timestamp` を自動抽出します。
  ```yaml
  # config/fieldmap/sample-regex.yaml
  type: regex
  pattern: 'host=(?P<host>[^\s]+).*?(?:server|dst)=(?P<dst>[0-9a-fA-F\.:]+)'
  fields:
    fqdn: '{host}'
    ip: '{dst}'
  timestamp:
    regex: '(?P<ts>\d{2}/[A-Za-z]{3}/\d{4}:\d{2}:\d{2}:\d{2} [+-]\d{4})'
    strptime: '%d/%b/%Y:%H:%M:%S %z'
  idn_normalize: true
  ```
  ```yaml
  # config/fieldmap/sample-json.yaml
  type: json
  json_paths:
    fqdn: 'host'
    ip: 'dst.ip'
    ts: '@timestamp'
  idn_normalize: true
  tz_assume: 'UTC'
  ```
- IDN は内部で Punycode に正規化し、出力時のみ Unicode に戻します。時刻は UTC で保持し、`reporting.date_format` で出力TZを制御します。
- `scripts/preflight.py` で fieldmap を検証し、パターン未設定などの失敗を事前に把握できます。

## FAQ

- **Q. `allowlist.txt` で抑止したい場合は？**  
  `config/allowlist.txt` に対象のFQDN/IP/ホスト名を1行ずつ記載してください。静的チェック・未使用検知・ダングリング検知のすべてで共通の抑止リストとして扱われ、レポートおよびIssueには表示されません。ドメインの前後に余計な空白やコメントがあると無視されるので注意してください。必要に応じて `labels.yaml` と併用し、抑止した理由をドキュメント化することを推奨します。
- **Q. `--online-axfr` を誤って他社ゾーンで実行したくありません**  
  `config/settings.yaml` の `dns.zone.allowed_online_axfr` に自ゾーンを明示的に追加してください。リスト外のゾーンでは `--online-axfr` はスキップされ、CIテンプレートでも確認フレーズを求めることで多重ガードにしています。

## Sponsors / Support

DNS Hygiene Guard は **自ゾーン限定・オフライン志向** の設計で、外部に生ログは保存しません。継続的なルール/指紋DBの更新を助けてもらえる場合、以下からご支援いただけます。

- GitHub Sponsors: *(your link here)*
