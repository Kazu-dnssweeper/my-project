export type DNSRecordType =
  | "A"
  | "AAAA"
  | "CNAME"
  | "MX"
  | "TXT"
  | "NS"
  | "SRV"
  | "CAA"
  | "PTR";

type RecordMeta = {
  id: string;
  zone_id: string;
  zone_name: string;
  name: string;
  type: DNSRecordType;
  content: string;
  ttl?: number;
  proxied?: boolean;
};

export type DNSRecord = RecordMeta;

export interface GarbageResult {
  isGarbage: boolean;
  reason?: string;
  confidence?: number;
  suggestion?: string;
  details?: Record<string, unknown>;
}

export interface ComprehensiveResult {
  record: DNSRecord;
  isGarbage: boolean;
  reason: string;
  confidence: number;
  checkResults: GarbageResult[];
  recommendation: "safe_to_delete" | "review_needed" | "keep";
}

export interface DomainAnalysisSummary {
  totalRecords: number;
  garbageCount: number;
  safeToDeleteCount: number;
  reviewNeededCount: number;
}

export interface DomainAnalysisResult {
  domain: string;
  scanDate: string;
  summary: DomainAnalysisSummary;
  results: ComprehensiveResult[];
  estimatedMonthlySavings: number;
  exportData: Record<string, unknown>[];
}
