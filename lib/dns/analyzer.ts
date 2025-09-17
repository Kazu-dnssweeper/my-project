import { Resolver } from "node:dns/promises";
import net from "node:net";

import pLimit from "p-limit";

import { fetchDNSRecords } from "@/lib/cloudflare/client";
import type {
  ComprehensiveResult,
  DNSRecord,
  DomainAnalysisResult,
  GarbageResult,
} from "@/lib/types/dns";

const resolver = new Resolver();

const fetchWithTimeout = async (url: string, timeout = 5000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(id);
  }
};

const checkPorts = async (host: string, ports: number[]) => {
  for (const port of ports) {
    try {
      await new Promise((resolve, reject) => {
        const socket = new net.Socket();
        socket.setTimeout(2000);
        const cleanup = () => {
          socket.removeAllListeners();
          socket.destroy();
        };
        socket.once("error", (error) => {
          cleanup();
          reject(error);
        });
        socket.once("timeout", () => {
          cleanup();
          reject(new Error("timeout"));
        });
        socket.connect(port, host, () => {
          cleanup();
          resolve(true);
        });
      });
      return true;
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.debug(`Port check failed for ${host}:${port}`, error);
      }
      continue;
    }
  }

  return false;
};

export const checkDeadSubdomain = async (
  record: DNSRecord
): Promise<GarbageResult> => {
  if (record.type !== "A" && record.type !== "AAAA") {
    return { isGarbage: false };
  }

  try {
    const resolved =
      record.type === "A"
        ? await resolver.resolve4(record.name)
        : await resolver.resolve6(record.name);
    if (!resolved || resolved.length === 0) {
      return {
        isGarbage: true,
        reason: "DNS解決失敗",
        confidence: 0.9,
      };
    }
  } catch (error: unknown) {
    const code = typeof error === "object" && error && "code" in error ?
      (error as { code?: string }).code : undefined;
    if (code === "ENOTFOUND") {
      return { isGarbage: true, reason: "NXDOMAIN", confidence: 0.95 };
    }
  }

  const protocols = ["https", "http"];
  let accessible = false;
  let lastError: unknown;

  for (const protocol of protocols) {
    try {
      const response = await fetchWithTimeout(`${protocol}://${record.name}`);
      if (
        (response.status >= 200 && response.status < 400) ||
        response.status === 401 ||
        response.status === 403
      ) {
        accessible = true;
        break;
      }
    } catch (error) {
      lastError = error;
    }
  }

  if (!accessible) {
    if (record.type === "A") {
      const portsAlive = await checkPorts(record.content, [22, 3306, 5432]);
      accessible = portsAlive;
    }
  }

  return {
    isGarbage: !accessible,
    reason: accessible ? "" : "どのプロトコルでも応答なし",
    confidence: accessible ? 0 : 0.8,
    details: {
      lastError: lastError instanceof Error ? lastError.message : undefined,
    },
  };
};

export const checkBrokenCNAME = async (
  record: DNSRecord
): Promise<GarbageResult> => {
  if (record.type !== "CNAME") {
    return { isGarbage: false };
  }

  const visited = new Set<string>();
  let current = record.content;
  let hops = 0;
  const maxHops = 5;

  while (hops < maxHops) {
    if (visited.has(current)) {
      return {
        isGarbage: true,
        reason: "CNAME循環参照",
        confidence: 1,
      };
    }

    visited.add(current);

    try {
      const cnames = await resolver.resolveCname(current);
      if (cnames.length === 0) {
        break;
      }
      current = cnames[0];
      hops += 1;
    } catch {
      break;
    }
  }

  try {
    const addresses = await resolver.resolve4(current);
    if (!addresses || addresses.length === 0) {
      return {
        isGarbage: true,
        reason: "CNAME先が解決できない",
        confidence: 0.95,
      };
    }
  } catch (error) {
    const code =
      typeof error === "object" && error && "code" in error
        ? (error as { code?: string }).code
        : undefined;
    return {
      isGarbage: true,
      reason: `CNAME解決エラー: ${code ?? "unknown"}`,
      confidence: 0.95,
      details: {
        target: record.content,
        finalTarget: current,
        hops,
      },
    };
  }

  return { isGarbage: false };
};

export const checkTestRecords = async (
  record: DNSRecord
): Promise<GarbageResult> => {
  const testPatterns: { pattern: RegExp; confidence: number }[] = [
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

  let matchedPattern: RegExp | null = null;
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

  if (record.type === "A" || record.type === "AAAA") {
    const aliveCheck = await checkDeadSubdomain(record);
    if (!aliveCheck.isGarbage) {
      maxConfidence *= 0.6;
    }
  }

  return {
    isGarbage: true,
    reason: "テスト用レコードの可能性",
    confidence: maxConfidence,
    suggestion: "本番環境では不要な可能性が高い",
    details: {
      matchedPattern: matchedPattern.toString(),
    },
  };
};

export const checkDuplicateRecords = async (
  record: DNSRecord,
  allRecords: DNSRecord[]
): Promise<GarbageResult> => {
  const duplicates = allRecords.filter(
    (candidate) =>
      candidate.id !== record.id &&
      candidate.type === record.type &&
      candidate.content === record.content &&
      candidate.name !== record.name
  );

  if (duplicates.length === 0) {
    return { isGarbage: false };
  }

  const priority = (candidate: DNSRecord) => {
    if (candidate.name === "@" || candidate.name === candidate.zone_name) {
      return 100;
    }
    if (candidate.name === "www") {
      return 90;
    }
    if (candidate.name.length <= 3) {
      return 50;
    }
    return 10 - candidate.name.charCodeAt(0) / 1000;
  };

  const recordPriority = priority(record);
  const higherPriority = duplicates.filter(
    (candidate) => priority(candidate) > recordPriority
  );

  if (higherPriority.length === 0) {
    return { isGarbage: false };
  }

  return {
    isGarbage: true,
    reason: `${higherPriority[0].name}と重複`,
    confidence: 0.7,
    suggestion: "重複レコードを整理することを推奨",
    details: {
      duplicateWith: higherPriority.map((candidate) => candidate.name),
    },
  };
};

export const checkWildcardConflicts = async (
  record: DNSRecord,
  allRecords: DNSRecord[]
): Promise<GarbageResult> => {
  const wildcards = allRecords.filter(
    (candidate) => candidate.name.startsWith("*.") && candidate.type === record.type
  );

  if (wildcards.length === 0) {
    return { isGarbage: false };
  }

  for (const wildcard of wildcards) {
    const wildcardDomain = wildcard.name.slice(2);
    if (record.name.endsWith(wildcardDomain)) {
      const subdomainPart = record.name.slice(
        0,
        record.name.length - wildcardDomain.length - 1
      );
      if (subdomainPart && !subdomainPart.includes(".")) {
        if (record.content === wildcard.content) {
          return {
            isGarbage: true,
            reason: "ワイルドカードで既にカバーされている",
            confidence: 0.85,
            suggestion: `${wildcard.name}があれば十分`,
            details: {
              wildcardRecord: wildcard.name,
              wildcardContent: wildcard.content,
            },
          };
        }
      }
    }
  }

  return { isGarbage: false };
};

const calculateSavings = (garbage: ComprehensiveResult[]) => {
  // Rough estimate: $0.01 per garbage record per month (Cloudflare DNS query costs avoidance)
  return Math.round(garbage.length * 0.01 * 100) / 100;
};

const generateExportData = (results: ComprehensiveResult[]) =>
  results.map((entry) => ({
    name: entry.record.name,
    type: entry.record.type,
    content: entry.record.content,
    reason: entry.reason,
    confidence: entry.confidence,
    recommendation: entry.recommendation,
  }));

export const analyzeRecord = async (
  record: DNSRecord,
  allRecords: DNSRecord[]
): Promise<ComprehensiveResult> => {
  const checks: GarbageResult[] = [];

  if (record.type === "A" || record.type === "AAAA") {
    checks.push(await checkDeadSubdomain(record));
  }

  if (record.type === "CNAME") {
    checks.push(await checkBrokenCNAME(record));
  }

  checks.push(await checkTestRecords(record));
  checks.push(await checkDuplicateRecords(record, allRecords));
  checks.push(await checkWildcardConflicts(record, allRecords));

  const garbage = checks.filter((result) => result.isGarbage);
  const topResult = garbage.sort(
    (a, b) => (b.confidence ?? 0) - (a.confidence ?? 0)
  )[0];

  let recommendation: ComprehensiveResult["recommendation"] = "keep";
  if (topResult) {
    recommendation =
      (topResult.confidence ?? 0) >= 0.8 ? "safe_to_delete" : "review_needed";
  }

  return {
    record,
    isGarbage: Boolean(topResult),
    reason: topResult?.reason ?? "OK",
    confidence: topResult?.confidence ?? 0,
    checkResults: checks,
    recommendation,
  };
};

export const analyzeDomain = async (
  domain: string,
  {
    onProgress,
  }: {
    onProgress?: (progress: number) => void;
  } = {}
): Promise<DomainAnalysisResult> => {
  const { records } = await fetchDNSRecords(domain);
  const limit = pLimit(5);
  const results: ComprehensiveResult[] = [];
  let processed = 0;

  await Promise.all(
    records.map((record) =>
      limit(async () => {
        const analysis = await analyzeRecord(record, records);
        results.push(analysis);
        processed += 1;
        if (onProgress) {
          onProgress(processed / records.length);
        }
      })
    )
  );

  const garbage = results.filter((result) => result.isGarbage);
  const safeToDelete = garbage.filter(
    (result) => result.recommendation === "safe_to_delete"
  );
  const reviewNeeded = garbage.filter(
    (result) => result.recommendation === "review_needed"
  );

  return {
    domain,
    scanDate: new Date().toISOString(),
    summary: {
      totalRecords: records.length,
      garbageCount: garbage.length,
      safeToDeleteCount: safeToDelete.length,
      reviewNeededCount: reviewNeeded.length,
    },
    results: garbage,
    estimatedMonthlySavings: calculateSavings(garbage),
    exportData: generateExportData(results),
  };
};

export const safeAnalyzeRecord = async (
  record: DNSRecord,
  allRecords: DNSRecord[]
) => {
  try {
    return await analyzeRecord(record, allRecords);
  } catch (error) {
    console.error(`Failed to analyze ${record.name}`, error);
    const fallback: ComprehensiveResult = {
      record,
      isGarbage: false,
      reason: "エラー: 分析できませんでした",
      confidence: 0,
      checkResults: [{ isGarbage: false, reason: "analysis_error" }],
      recommendation: "keep",
    };
    return fallback;
  }
};
