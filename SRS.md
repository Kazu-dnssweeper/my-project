# SRS v2.2 — DNS Hygiene Guard（顧客セルフサーブ版 / Codex・GPT‑5 Pro補助）

## 0. 前提と方針

* 対象は**顧客が管理権限を持つゾーンのみ**（第三者ドメインは非対象）。
* 実行・保管は**顧客のサーバ/社内環境で完結**（生ログを外部に出さない）。
* **Codex/GPT‑5 Pro**は実装・テスト・設定生成の“作業係”。**最終承認と秘密情報の発行/保管は人（顧客/あなた）**。
* **推測ですが** 代表的な環境：Linux（Nginx/Apache/HAProxy/Envoy）、Windows（IIS）、Kubernetes、社内GitLab/Runner。

---

## 1. 目的

1. **静的健全性チェック（無料版）**：誤設定/危険なDNSを根拠つきで検出。
2. **ゼロトラフィック検知（Pro）**：顧客の**1日分のログ**からFQDN/IPの使用実績を抽出し、**過去N日未使用**を候補提示（集合のみ保持・生ログ非保持）。

---

## 2. デプロイ・運用モード（顧客が選択）

| モード                 | 想定環境                | スケジューラ                       | 収納           | 備考                       |
| ------------------- | ------------------- | ---------------------------- | ------------ | ------------------------ |
| **A. 単体バイナリ/スクリプト** | Linux/Windows       | cron / Task Scheduler        | ローカルFS       | 最小依存（Python or Go版）。     |
| **B. コンテナ**         | Docker/Podman       | host cron / container’s cron | マウントVolume   | ログファイルをボリュームで読む。         |
| **C. Kubernetes**   | K8s                 | CronJob                      | PVC          | RBAC最小、`readOnlyMany`推奨。 |
| **D. CI実行**         | 社内GitLab/GHE Runner | CIスケジュール                     | アーティファクト/SMB | Runnerにログをマウント。          |

> いずれも**顧客サーバ内で完結**。通知は社内メール/Slack/社内Gitへ。

---

## 3. 入力ソース（“広く”対応するためのプラグイン体系）

### 3.1 DNSゾーン（どれか一つ以上）

* **Z‑01** BINDゾーンファイル（*.zone）
* **Z‑02** `targets.txt`（FQDN/IP列挙：CSV/JSON/YAML対応）
* **Z‑03** PowerDNS/Knot/Windows DNS **CLIエクスポート**（読み取りのみ）
* **Z‑04** クラウドDNS API（Cloudflare/Route53/GCP/Azure）**Read専用**（Pro・任意）

> **不可**：ゾーンの取得が一切できない場合、**未使用判定は成立しません**（差集合が作れないため）。

### 3.2 交通ログ（ゼロトラ用・任意）

* **L7 HTTP/HTTPS（推奨）**

  * Nginx/Apache/HAProxy/Envoy/IIS **ファイルログ**（W3C/JSON/拡張CLF）。
  * **要件**：レコードに**Host（FQDN）**または**SNI**、**宛先IP**のどちらか（理想は両方）が含まれること。
* **L4 フロー**（任意）

  * Firewall/LB/Netflow/IPFIX/conntrack 等の**送受IP**ログ。
* **DNS 問い合わせログ**（任意）

  * BIND/Unbound/Knot/Windows DNSの**querylog/dnstap**等。

> **不可**：**FQDNもSNIも含まない**HTTPログしか無い、かつ**DNSログも無い**場合、**FQDN未使用の精度は出ません**（IPベースのみ＝限定的）。

---

## 4. 機能要件（Free / Pro）

### 4.1 Free（無料版：静的チェック）

* **FR‑01** MX‑CNAME：MX先がCNAME → **NG**（medium）
* **FR‑02** MX‑NXDOMAIN：MX先が解決不能 → **NG**（high）
* **FR‑03** SPF‑LOOKUP：`v=spf1`のDNS参照**>10** → **警告**
* **FR‑04** PRIVATE‑IP：A/AAAA が RFC1918/Loopback/Link‑local → **警告**（内部ゾーンは除外可）
* **FR‑05** NS‑HEALTH：NS A/AAAA未解決 or SOA権威応答不可 → **警告**
* **FR‑06** OPEN‑AXFR：任意元からAXFR成功 → **致命（critical）** ※自ゾーンのみ
* **FR‑07** ALLOWLIST：`allowlist.txt`で抑止
* **FR‑08** REPORT/NOTIFY：`report.md/json`出力、検出>0で通知（メール/Slack/社内Git Issue）

### 4.2 Pro（有料版）

* **FR‑09** DANGLING‑CNAME：既知SaaS終端＋HTTP本文/挙動が指紋一致 → **疑い（high）**
* **FR‑10** USAGE‑INGEST：前日分ログから `seen_fqdns(d)` / `seen_ips(d)` を抽出（gzip/日付範囲対応、巨大ログはストリーミング）
* **FR‑11** USAGE‑INDEX：`usage_index` を**N日ローリング**（既定30日）。**生ログは保持しない**
* **FR‑12** UNUSED‑FQDN / UNUSED‑IP：

  * `unused_fqdns = zone_fqdns − active_fqdns(N)`
  * `unused_ips = zone_ips − active_ips(N)`
  * CNAMEは**終端名**で判定（外部終端は保守的に除外）
* **FR‑13** CONFIDENCE：観測範囲で `high|medium|low`（例：HTTP+L4=high、HTTPのみ=medium、DNSのみ=low）
* **FR‑14** SEVERITY‑OVERRIDE：`config/severity.yaml`で重大度の上書き
* **FR‑15** REPORT‑TUNING：章立て/表記の調整（表/ソート・しきい値）
* **FR‑16** PR‑SUGGEST（任意）：ゾーンをGit管理している場合、**修正差分の雛形**を生成
* **FR‑17** CLOUD‑LIST（任意）：クラウドDNS **Read専用**で対象列挙
* **FR‑18** SECRETS‑HELPER：通知や社内Git連携の**対話セットアップ**＋**期限監視**

---

## 5. ログ対応（“幅広く”の具体）

### 5.1 既定サポート（出荷時）

* **Nginx**：拡張CLF/JSON（`$host`/`$ssl_server_name`/`$server_addr` を含む）
* **Apache**：W3C/拡張CLF（`%{Host}i`/`%v`/`%A`）
* **HAProxy/Envoy**：テキストまたはJSON（`Host`/SNI/`dst_ip`）
* **IIS**：W3C（`cs-host`/`s-ip` 項目）

### 5.2 追加の受け入れ口

* **syslog/journald**：パーサで`host=`等のキー抽出に対応
* **JSONライン**：任意キー→`field map`で正規化（設定ファイルで対応）

> **不可**：**Host/SNI/宛先IPがどの経路にも残っていない**場合、**FQDN未使用の確定はできません**。回避策＝フロント（LB/リバースプロキシ）で**Host出力を有効化**する設定変更が必要です。

---

## 6. 設定ファイル（顧客が自力で扱える前提）

```
config/
  settings.yaml        # 窓長/並列/タイムアウト/ログパス/通知先/実行時刻 等
  severity.yaml        # Pro: 重大度上書き
  labels.yaml          # 除外ラベル（healthcheck/cdn-managed など）
  allowlist.txt        # 抑止対象
  fingerprints.json    # Pro: ダングリング指紋DB
  fieldmap/*.yaml      # 任意JSON/テキストログ → 正規化マップ
```

**settings.yaml（例・抜粋）**

```yaml
window_days: 30
logs:
  - name: front-nginx
    type: nginx
    paths:
      - /var/log/nginx/access_hygiene.log
      - /var/log/nginx/access_hygiene.log.1
      - /var/log/nginx/access_hygiene.log.*.gz
    format: nginx_hygiene   # 既定パーサ
  - name: iis
    type: iis_w3c
    paths: [ "D:\\logs\\w3c\\u_ex*.log" ]
dns:
  zone:
    mode: "bind_zone_files"   # or targets_file / powerdns_export / windows_export / cloud_readonly
    paths: ["/etc/bind/zones/*.zone"]
notify:
  email: noc@example.com
  slack_webhook: ""
runtime:
  concurrency: 8
  timeout_sec: 5
```

---

## 7. 出力・保存

* `report.md` / `report.json`：検出/根拠/推奨対応/最終観測日/確信度
* `usage_index.json`（Pro）：`{日付 → seen_fqdns[], seen_ips[]}`（**集合のみ**）
* 保存場所：`/var/lib/dns-hygiene/`（変更可）／コンテナならボリューム

---

## 8. 非機能要件（顧客が現実に回せるライン）

* 1日分ログ（～数GB）＋対象1000で**10分以内**（並列/ストリーミング）
* 失敗は**独立リトライ1回**、全体継続
* 生ログ**非保持**、平文の秘密情報**非出力**
* Windowsは**IIS W3C**と**PowerShellエクスポート**で対応（サービスアカウントに**読み取り権限のみ**付与）

---

## 9. セキュリティ/プライバシ

* 秘密情報は顧客が発行・保管（本ツールは**読み取りのみ**）。
* AXFRは**自ゾーンのみ**。第三者NSへの無断AXFRは**不可**。
* ネットワーク送信は通知先（Slack/メール/社内Git）**だけ**（オフにも可）。

---

## 10. 受け入れ基準（AC）

* **AC‑Free**：MX/ SPF/ Private‑IP/ NS/ AXFR を検出・抑止・通知できる。
* **AC‑Pro**：

  * 前日ログからFQDN/IPが抽出され、`usage_index`が**ローリング**更新。
  * `unused_fqdns/unused_ips` が出力され、`confidence`が付く。
  * 検出0件時は**無通知**、秘密情報未設定時は**親切に失敗**して手順提示。

---

## 11. 不可/要設定（正直に）

* **不可**：FQDNがどのログにも現れず（HostもSNIも無し）、DNS問い合わせログも無い場合、**FQDN未使用の判定はできません**。
* **要設定**：HTTPログに**Host/SNI**と**宛先IP**のいずれかを**含める**（ログ書式の追加が必要）。
* **不可**：ゾーンの取得手段が無い場合、**未使用（差集合）**は算出できません（“使用実績一覧”のみ）。

---

### ひとこと

これで**顧客が自分で導入できる幅**を最大化しました。**推測ですが** 現場の差異は「ログにHost/SNIがあるか」「ゾーンが取り出せるか」に集約されます。
必要なら、このSRSとマイルストーンを**Markdownファイル（`SRS.md` / `MILESTONES.md` / `OPERATIONS.md`）**として今すぐ出力します。
