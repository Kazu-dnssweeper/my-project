# マイルストーン v2.2 — 顧客セルフサーブで導入できる計画

> **RACI簡略**：Codex=R（実装） / あなた=A（最終承認） / 顧客=R or C（実施/協力）

### **M0：セルフ導入の骨格**

* **Codex(R)**：単体版・コンテナ版・K8s CronJobのテンプレ出力、`settings.yaml`雛形、`preflight`（OS/権限/ログ存在チェック）
* **あなた(A)**：READMEと“**自ゾーン限定**/禁止事項”明記
* **顧客(R)**：どのモードで動かすか選定（A/B/C/D）
  **DoD**：preflightが**緑**で通り、空レポートを出せる

### **M1：無料コア（静的4本）**

* **Codex(R)**：MX‑CNAME/NXDOMAIN、SPF>10、Private‑IP、NS‑Health 実装＋ユニットテスト
* **あなた(A)**：重大度既定表
* **顧客(C)**：ゾーン入力（*.zone / targets.txt など）
  **DoD**：AC‑Freeの基本3項目が合格

### **M2：通知・抑止・AXFR**

* **Codex(R)**：OPEN‑AXFR、`allowlist.txt`、通知（メール/Slack/社内Git Issue）、**親切Fail**（Secrets未設定時ガイド）
* **顧客(R)**：通知先の準備（Webhook/メール）
  **DoD**：検出>0で通知、未設定はガイド付きFail

### **M3：ログ取り込み（Pro前提の下準備）**

* **Codex(R)**：Nginx/Apache/HAProxy/IIS パーサ、gzip/日付フィルタ/巨大ログ対応
* **顧客(R)**：**Host/SNI/宛先IP**が出るログ書式へ変更（テンプレあり）
  **DoD**：前日ログから**FQDN/IP集合**が抽出される

### **M4：ゼロトラ（Pro）**

* **Codex(R)**：`usage_index`（N日ローリング）、`unused_fqdns/unused_ips`算出、`confidence`付与、`labels.yaml`反映
* **あなた(A)**：`labels.yaml`の初期テンプレ（healthcheck/cdn-managed等）
* **顧客(C)**：除外条件の合意
  **DoD**：AC‑Pro合格（未使用候補＋confidence）

### **M5：Pro拡張（任意）**

* **Codex(R)**：ダングリングCNAME（指紋DB）、重大度上書き（`severity.yaml`）、レポート調整、PR雛形
* **顧客(C)**：指紋DBの適用範囲/更新方針を承認
  **DoD**：Proトグルで機能切替が可能

### **M6：Windows/Kubernetes/CI対応の仕上げ**

* **Codex(R)**：IIS W3C安定化、PowerShellエクスポート、K8s CronJob+PVC、GitLab/GHE CIジョブ雛形
* **顧客(R)**：自社標準に合わせデプロイ選択
  **DoD**：各モードのサンプルが動作

### **M7：ハードニングと運用**

* **Codex(R)**：権限最小化（非root・ログreadグループ）、ファイル権限600/640、再試行とメトリクス
* **あなた(A)**：運用Runbook（障害時・ログ欠落時）
* **顧客(R)**：本番化・1週間の連続運転
  **DoD**：安定稼働と再現性

---

## 顧客に渡す“導入チェックリスト”（セルフサーブ用）

* [ ] **デプロイ方式**（単体/コンテナ/K8s/CI）を選びました
* [ ] **ゾーン入力**（*.zone / targets.txt / エクスポート）を用意しました
* [ ] **ログ書式**に**Host（またはSNI）**と**宛先IP**が含まれています（Proを使う場合）
* [ ] **通知先**（メール/Slack/社内Git）の資格情報を発行しました
* [ ] **権限**は読み取りのみで付与しました（サービスユーザ or Runner）
* [ ] **本番前テスト**：preflight→無料版→Proの順で合格しました

---

## 率直な限界（“ダメなものはダメ”）

* **FQDN未使用の確定**は、**Host/SNI**か**DNSログ**のどちらかが必須。どちらも無い場合は**不可**（IPだけの近似は提供可だが限定的）。
* **未使用判定**には**N日の窓**が必須。**1日だけ**だと“たまたまゼロ”を誤検出します。
* **ゾーンが取得できない**と**未使用（差集合）**は算出不可（“使用実績一覧”のみ）。
