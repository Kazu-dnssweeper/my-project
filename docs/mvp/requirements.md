# DNSweeper MVP 要件定義書（個人副業版）

## 📋 プロジェクト概要

- **プロダクト名**: DNSweeper MVP
- **バージョン**: 1.0
- **開発期間**: 3-6ヶ月（週20時間想定）
- **開発体制**: 個人開発
- **技術スタック**: Next.js 15 / Supabase / Tailwind CSS / Vercel
- **初期投資**: $0-50/月（無料枠最大活用）
- **目標**: シンプルで実用的なDNSゴミレコード検出ツール

---

## 🎯 MVP機能要件

### 1. コア機能 - DNSゴミ検出

#### 1.1 検出対象（最優先の5種類）
```typescript
interface DetectableGarbage {
  deadSubdomains: {
    description: "404/タイムアウトするサブドメイン";
    impact: "不要なDNSクエリコスト";
    autoFix: false;
  };

  brokenCNAMEs: {
    description: "参照先が存在しないCNAME";
    impact: "エラーの原因";
    autoFix: false;
  };

  unusedTestRecords: {
    description: "明らかにテスト用のレコード";
    patterns: ['test-*', 'dev-*', 'staging-*', 'temp-*'];
    autoFix: false;
  };

  duplicateRecords: {
    description: "同一内容の重複レコード";
    impact: "管理の混乱";
    autoFix: false;
  };

  wildcardConflicts: {
    description: "*.example.comと競合する個別レコード";
    impact: "予期しない動作";
    autoFix: false;
  };
}
```

#### 1.2 詳細な検出ロジック

##### 1.2.1 死んでいるサブドメイン
```typescript
async function checkDeadSubdomain(record: DNSRecord): Promise<GarbageResult> {
  try {
    const resolved = await dns.resolve4(record.name);
    if (!resolved || resolved.length === 0) {
      return { isGarbage: true, reason: 'DNS解決失敗', confidence: 0.9 };
    }
  } catch (error) {
    if (error.code === 'ENOTFOUND') {
      return { isGarbage: true, reason: 'NXDOMAIN', confidence: 0.95 };
    }
  }

  const protocols = ['https', 'http'];
  let accessible = false;
  let lastError = null;

  for (const protocol of protocols) {
    try {
      const response = await fetch(`${protocol}://${record.name}`, {
        method: 'HEAD',
        timeout: 5000,
        redirect: 'follow'
      });

      if (response.status >= 200 && response.status < 400 ||
          response.status === 401 || response.status === 403) {
        accessible = true;
        break;
      }
    } catch (error) {
      lastError = error;
      continue;
    }
  }

  if (!accessible && record.type === 'A') {
    const commonPorts = [22, 3306, 5432];
    for (const port of commonPorts) {
      try {
        const socket = new net.Socket();
        await new Promise((resolve, reject) => {
          socket.setTimeout(2000);
          socket.connect(port, record.content, () => {
            socket.destroy();
            resolve(true);
          });
          socket.on('error', () => reject(false));
          socket.on('timeout', () => reject(false));
        });
        accessible = true;
        break;
      } catch {
        continue;
      }
    }
  }

  return {
    isGarbage: !accessible,
    reason: accessible ? null : 'どのプロトコルでも応答なし',
    confidence: accessible ? 0 : 0.8,
    details: {
      httpStatus: null,
      error: lastError?.message
    }
  };
}
```

##### 1.2.2 壊れたCNAME
```typescript
async function checkBrokenCNAME(record: DNSRecord): Promise<GarbageResult> {
  if (record.type !== 'CNAME') {
    return { isGarbage: false };
  }

  try {
    const target = record.content;
    let current = target;
    let hops = 0;
    const maxHops = 5;
    const visited = new Set<string>();

    while (hops < maxHops) {
      if (visited.has(current)) {
        return {
          isGarbage: true,
          reason: 'CNAME循環参照',
          confidence: 1.0
        };
      }
      visited.add(current);

      try {
        const cnames = await dns.resolveCname(current);
        if (cnames && cnames.length > 0) {
          current = cnames[0];
          hops++;
        } else {
          break;
        }
      } catch {
        break;
      }
    }

    try {
      const addresses = await dns.resolve4(current);
      if (!addresses || addresses.length === 0) {
        return {
          isGarbage: true,
          reason: 'CNAME先が解決できない',
          confidence: 0.95
        };
      }
    } catch (error) {
      return {
        isGarbage: true,
        reason: `CNAME解決エラー: ${error.code}`,
        confidence: 0.95,
        details: {
          target: target,
          finalTarget: current,
          hops: hops
        }
      };
    }

    return { isGarbage: false };
  } catch (error) {
    return {
      isGarbage: true,
      reason: 'CNAME検証エラー',
      confidence: 0.9
    };
  }
}
```

##### 1.2.3 テスト・開発用レコード
```typescript
async function checkTestRecords(record: DNSRecord): Promise<GarbageResult> {
  const testPatterns = [
    { pattern: /^test[-\.]?/i, confidence: 0.9 },
    { pattern: /^dev[-\.]?/i, confidence: 0.9 },
    { pattern: /^staging[-\.]?/i, confidence: 0.85 },
    { pattern: /^demo[-\.]?/i, confidence: 0.8 },
    { pattern: /^temp[-\.]?/i, confidence: 0.9 },
    { pattern: /^tmp[-\.]?/i, confidence: 0.9 },
    { pattern: /^old[-\.]?/i, confidence: 0.85 },
    { pattern: /^backup[-\.]?/i, confidence: 0.8 },
    { pattern: /^deleted?[-\.]?/i, confidence: 0.95 },
    { pattern: /\d{4}[-_]?\d{2}[-_]?\d{2}/, confidence: 0.7 },
    { pattern: /v\d+[-\.]test/i, confidence: 0.85 },
    { pattern: /^(john|jane|bob|alice|test|admin|user\d+)[-\.]/i, confidence: 0.7 },
  ];

  let matchedPattern = null;
  let maxConfidence = 0;

  for (const { pattern, confidence } of testPatterns) {
    if (pattern.test(record.name)) {
      if (confidence > maxConfidence) {
        maxConfidence = confidence;
        matchedPattern = pattern;
      }
    }
  }

  if (!matchedPattern) {
    return { isGarbage: false };
  }

  if (record.type === 'A' || record.type === 'AAAA') {
    const aliveCheck = await checkDeadSubdomain(record);
    if (!aliveCheck.isGarbage) {
      maxConfidence *= 0.6;
    }
  }

  return {
    isGarbage: true,
    reason: 'テスト用レコードの可能性',
    confidence: maxConfidence,
    suggestion: '本番環境では不要な可能性が高い',
    details: {
      matchedPattern: matchedPattern.toString()
    }
  };
}
```

##### 1.2.4 重複レコード
```typescript
async function checkDuplicateRecords(
  record: DNSRecord,
  allRecords: DNSRecord[]
): Promise<GarbageResult> {
  const duplicates = allRecords.filter(r =>
    r.id !== record.id &&
    r.type === record.type &&
    r.content === record.content &&
    r.name !== record.name
  );

  if (duplicates.length === 0) {
    return { isGarbage: false };
  }

  const getPriority = (r: DNSRecord): number => {
    if (r.name === '@' || r.name === record.zone) return 100;
    if (r.name === 'www') return 90;
    if (r.name.length <= 3) return 50;
    return 10 - (r.name.charCodeAt(0) / 1000);
  };

  const recordPriority = getPriority(record);
  const higherPriorityDuplicates = duplicates.filter(d =>
    getPriority(d) > recordPriority
  );

  if (higherPriorityDuplicates.length === 0) {
    return { isGarbage: false };
  }

  return {
    isGarbage: true,
    reason: `${higherPriorityDuplicates[0].name}と重複`,
    confidence: 0.7,
    suggestion: '重複レコードを整理することを推奨',
    details: {
      duplicateWith: higherPriorityDuplicates.map(d => d.name)
    }
  };
}
```

##### 1.2.5 ワイルドカード競合
```typescript
async function checkWildcardConflicts(
  record: DNSRecord,
  allRecords: DNSRecord[]
): Promise<GarbageResult> {
  const wildcards = allRecords.filter(r =>
    r.name.startsWith('*.') && r.type === record.type
  );

  if (wildcards.length === 0) {
    return { isGarbage: false };
  }

  for (const wildcard of wildcards) {
    const wildcardDomain = wildcard.name.substring(2);

    if (record.name.endsWith(wildcardDomain)) {
      const subdomainPart = record.name.substring(0,
        record.name.length - wildcardDomain.length - 1
      );

      if (subdomainPart && !subdomainPart.includes('.')) {
        if (record.content === wildcard.content) {
          return {
            isGarbage: true,
            reason: 'ワイルドカードで既にカバーされている',
            confidence: 0.85,
            suggestion: `${wildcard.name}があれば十分`,
            details: {
              wildcardRecord: wildcard.name,
              wildcardContent: wildcard.content
            }
          };
        }
      }
    }
  }

  return { isGarbage: false };
}
```

##### 1.2.6 総合判定ロジック
```typescript
interface GarbageResult {
  isGarbage: boolean;
  reason?: string;
  confidence?: number;
  suggestion?: string;
  details?: any;
}

interface ComprehensiveResult {
  record: DNSRecord;
  isGarbage: boolean;
  reason: string;
  confidence: number;
  checkResults: GarbageResult[];
  recommendation: 'safe_to_delete' | 'review_needed' | 'keep';
}

async function analyzeRecord(
  record: DNSRecord,
  allRecords: DNSRecord[]
): Promise<ComprehensiveResult> {
  const results: GarbageResult[] = [];

  if (record.type === 'A' || record.type === 'AAAA') {
    results.push(await checkDeadSubdomain(record));
  }

  if (record.type === 'CNAME') {
    results.push(await checkBrokenCNAME(record));
  }

  results.push(await checkTestRecords(record));
  results.push(await checkDuplicateRecords(record, allRecords));
  results.push(await checkWildcardConflicts(record, allRecords));

  const garbageResults = results.filter(r => r.isGarbage);
  const topResult = garbageResults.sort((a, b) =>
    (b.confidence || 0) - (a.confidence || 0)
  )[0];

  let recommendation: 'safe_to_delete' | 'review_needed' | 'keep';
  if (!topResult) {
    recommendation = 'keep';
  } else if (topResult.confidence >= 0.8) {
    recommendation = 'safe_to_delete';
  } else {
    recommendation = 'review_needed';
  }

  return {
    record,
    isGarbage: !!topResult,
    reason: topResult?.reason || 'OK',
    confidence: topResult?.confidence || 0,
    checkResults: results,
    recommendation
  };
}
```

##### 1.2.7 バッチ分析の最適化
```typescript
import pLimit from 'p-limit';

async function analyzeDomain(domain: string): Promise<DomainAnalysisResult> {
  const records = await fetchDNSRecords(domain);

  const limit = pLimit(5);

  let processed = 0;
  const onProgress = (progress: number) => {
    console.log(`分析中: ${Math.round(progress * 100)}%`);
  };

  const results = await Promise.all(
    records.map((record) =>
      limit(async () => {
        const result = await analyzeRecord(record, records);
        processed++;
        onProgress(processed / records.length);
        return result;
      })
    )
  );

  const garbage = results.filter(r => r.isGarbage);
  const safeToDelete = garbage.filter(r => r.recommendation === 'safe_to_delete');
  const reviewNeeded = garbage.filter(r => r.recommendation === 'review_needed');

  return {
    domain,
    scanDate: new Date(),
    summary: {
      totalRecords: records.length,
      garbageCount: garbage.length,
      safeToDeleteCount: safeToDelete.length,
      reviewNeededCount: reviewNeeded.length
    },
    results: garbage,
    estimatedMonthlySavings: calculateSavings(garbage),
    exportData: generateExportData(results)
  };
}
```

##### 1.2.8 エラーハンドリングと制限事項
```typescript
interface AnalysisLimitations {
  cannotDetect: {
    internalOnly: '社内ネットワークからのみアクセス可能なレコード';
    vpnRequired: 'VPN接続が必要なレコード';
    geoRestricted: '地域制限があるレコード';
    intermittentUse: '定期的にしか使われないレコード';
    mailServers: 'メール送信のみで使用されるMXレコード';
  };

  falsePositiveRisk: {
    maintenance: 'メンテナンス中のサービス';
    apiEndpoints: '外部公開していない内部API';
    backupSystems: 'バックアップ・フェイルオーバー用';
    seasonalServices: '季節・イベント限定サービス';
  };

  disclaimer: `
    【重要】DNSweeperの判定について

    • 本ツールは「ゴミの可能性がある」レコードを提示します
    • 削除の最終判断は必ずお客様自身で行ってください
    • 削除前に以下を必ず確認してください：
      - 社内システムでの利用有無
      - 外部サービスとの連携
      - 季節的・一時的な利用
      - バックアップ・災害対策用途

    • 削除による影響は弊社では責任を負いかねます
    • 不明な場合は削除せず、社内のIT部門にご相談ください
  `;
}

async function safeAnalyze(record: DNSRecord): Promise<GarbageResult> {
  try {
    return await analyzeRecord(record, allRecords);
  } catch (error) {
    console.error(`Failed to analyze ${record.name}:`, error);
    return {
      isGarbage: false,
      reason: 'エラー: 分析できませんでした',
      confidence: 0,
      details: {
        error: error.message
      }
    };
  }
}
```

### 2. ユーザーインターフェース（Webのみ）

#### 2.1 必要な画面
```typescript
const pages = {
  '/': 'ランディング（説明+価格）',
  '/app': 'ダッシュボード（ドメイン一覧）',
  '/app/scan': 'スキャン実行・結果表示',
  '/app/history': 'スキャン履歴',
  '/app/settings': '設定（決済情報）'
};
```

#### 2.2 UIコンポーネント
```typescript
const uiComponents = {
  'ドメイン入力フォーム': 'shadcn/ui',
  'ゴミレコード表': 'シンプルなテーブル',
  'エクスポートボタン': 'CSV/PDFダウンロード',
  'プログレスバー': 'スキャン進捗表示'
};
```

### 3. データモデル（最小限）

#### 3.1 Supabaseテーブル設計
```sql
CREATE TABLE domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  domain_name TEXT NOT NULL,
  last_scan TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID REFERENCES domains(id),
  garbage_count INTEGER DEFAULT 0,
  total_records INTEGER DEFAULT 0,
  result JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT,
  current_period_end TIMESTAMP
);
```

※ 本番環境では `supabase/migrations/0001_init.sql` を Supabase CLI で適用し、RLS ポリシーも併せて構成する。

### 4. 認証・決済

#### 4.1 認証（Supabase Auth）
```typescript
const auth = {
  providers: ['email', 'google'],
  features: {
    passwordReset: true,
    emailVerification: false,
    mfa: false
  }
};
```

#### 4.2 決済（Stripe）
```typescript
const pricing = {
  free: {
    price: 0,
    features: {
      scansPerMonth: 5,
      domainsTracked: 1,
      exportCSV: false,
      exportPDF: false
    }
  },
  pro: {
    price: 19,
    features: {
      scansPerMonth: 'unlimited',
      domainsTracked: 'unlimited',
      exportCSV: true,
      exportPDF: true,
      emailAlerts: true,
      prioritySupport: false
    }
  }
};
```

### 5. 技術仕様

#### 5.1 フロントエンド構成
```json
{
  "dependencies": {
    "next": "15.0.0",
    "react": "^19.0.0",
    "typescript": "^5.0.0",
    "@supabase/supabase-js": "^2.0.0",
    "@supabase/ssr": "^0.7.0",
    "stripe": "^17.0.0",
    "@stripe/stripe-js": "^5.0.0",
    "tailwindcss": "^4.0.0",
    "react-query": "^3.0.0",
    "react-hook-form": "^7.0.0",
    "zod": "^3.0.0",
    "p-limit": "^6.0.0"
  }
}
```

#### 5.2 API設計（Next.js API Routes）
```typescript
export async function POST(req: Request) {
  const { domain } = await req.json();

  const records = await fetchDNSRecords(domain);
  const analysisResult = await analyzeDomain(domain);
  await saveResults(domain, analysisResult);

  return NextResponse.json(analysisResult);
}

export async function POST(req: Request) {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{
      price: process.env.STRIPE_PRICE_ID,
      quantity: 1
    }],
    success_url: `${origin}/app?success=true`,
    cancel_url: `${origin}/pricing?canceled=true`
  });

  return NextResponse.json({ url: session.url });
}
```

#### 5.3 外部API
```typescript
const cloudflareIntegration = {
  auth: 'API Token（読み取り専用）',
  endpoints: {
    listZones: 'GET /zones',
    listDNSRecords: 'GET /zones/{zone_id}/dns_records'
  },
  rateLimit: '1200 requests/5min'
};
```

### 6. 開発環境とデプロイ

#### 6.1 開発環境
```bash
npx create-next-app@latest dnsweeper --typescript --tailwind --app
cd dnsweeper
npm install @supabase/supabase-js stripe
```

環境変数（`.env.local`）
```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
STRIPE_SECRET_KEY=your-stripe-secret
STRIPE_WEBHOOK_SECRET=your-webhook-secret
CLOUDFLARE_API_TOKEN=your-cf-token
```

#### 6.2 デプロイ（Vercel）
```typescript
const deployment = {
  platform: 'Vercel',
  plan: 'Hobby',
  features: {
    serverlessFunctions: true,
    edgeFunctions: false,
    analytics: false,
    customDomain: true
  }
};
```

### 7. MVP開発ロードマップ

#### Phase 1: 基礎構築（Month 1）
```
Week 1-2: 環境構築とSupabase設定
Week 3-4: コア機能実装
```

#### Phase 2: 機能完成（Month 2）
```
Week 5-6: UI実装
Week 7-8: 認証と履歴
```

#### Phase 3: 収益化準備（Month 3）
```
Week 9-10: Stripe統合
Week 11-12: 仕上げとテスト
```

### 8. 運用・保守

#### 8.1 監視（無料ツール）
```typescript
const monitoring = {
  uptime: 'UptimeRobot',
  errors: 'Sentry',
  analytics: 'Vercel Analytics'
};
```

#### 8.2 サポート体制
```typescript
const support = {
  channels: ['email'],
  responseTime: '24-48時間',
  documentation: 'Notion',
  community: 'Discord（将来的に）'
};
```

### 9. マーケティング戦略（コスト$0）
```
1. ProductHunt投稿
2. Hacker News Show HN
3. Redditコミュニティ
4. Twitter/Xでの発信
5. 技術ブログ（Zenn/Qiita）
```

SEOキーワード
```
- DNS garbage detector
- DNS cleanup tool
- reduce DNS costs
- DNS記録 整理
```

### 10. 収益目標と成長戦略
```
Month 1-3: 開発期間（収益$0）
Month 4: 無料ユーザー100人
Month 6: 有料ユーザー10人（$190/月）
Month 12: 有料ユーザー50人（$950/月）
```

将来機能
```typescript
const futureFeatures = {
  v1.1: 'スケジュール自動スキャン',
  v1.2: '他のDNSプロバイダー対応',
  v1.3: 'Slack/Discord通知',
  v2.0: 'チーム機能'
};
```

### 11. リスクと対策
```
リスク: Cloudflare APIレート制限 → 対策: キャッシュとキューイング
リスク: 誤検出 → 対策: 削除提案のみ
リスク: 競合の出現 → 対策: 日本市場に特化
リスク: 時間不足 → 対策: 機能を削ぎ落とす勇気
```

---

## 🚀 今すぐ始められるアクション
```bash
npx create-next-app@latest dnsweeper --typescript --tailwind --app
npm install @supabase/supabase-js @supabase/ssr stripe
```

Supabaseプロジェクトを作成し、最初のDNSレコード取得APIから着手する。
