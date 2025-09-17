import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type { DomainAnalysisResult } from "@/lib/types/dns";
import type { Database } from "@/lib/types/database";

const getClient = () => createSupabaseServiceRoleClient();

type DomainTable = Database["public"]["Tables"]["domains"];
type DomainRow = DomainTable["Row"];
type DomainInsert = DomainTable["Insert"];
type ScanTable = Database["public"]["Tables"]["scans"];
type ScanRow = ScanTable["Row"];
type ScanInsert = ScanTable["Insert"];

export const upsertDomainForUser = async (
  userId: string,
  domainName: string
): Promise<DomainRow> => {
  const supabase = getClient();
  const payload: DomainInsert = {
    domain_name: domainName,
    user_id: userId,
  };

  const { data, error } = await supabase
    .from("domains")
    .upsert(payload, { onConflict: "domain_name,user_id" })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to upsert domain: ${error.message}`);
  }

  return data as DomainRow;
};

export const insertScanResult = async (
  userId: string,
  domainId: string,
  analysis: DomainAnalysisResult
) => {
  const supabase = getClient();
  const payload: ScanInsert = {
    domain_id: domainId,
    garbage_count: analysis.summary.garbageCount,
    total_records: analysis.summary.totalRecords,
    result: analysis as unknown as ScanInsert["result"],
  };

  const { error: scanError } = await supabase.from("scans").insert(payload);

  if (scanError) {
    throw new Error(`Failed to insert scan result: ${scanError.message}`);
  }

  const { error: domainError } = await supabase
    .from("domains")
    .update({ last_scan: new Date().toISOString() })
    .eq("id", domainId)
    .eq("user_id", userId);

  if (domainError) {
    throw new Error(`Failed to update domain last_scan: ${domainError.message}`);
  }
};

export const fetchDomainHistory = async (
  userId: string,
  domainId: string
): Promise<ScanRow[]> => {
  const supabase = getClient();

  const { data, error } = await supabase
    .from("scans")
    .select("*")
    .eq("domain_id", domainId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch scan history: ${error.message}`);
  }

  return (data ?? []) as ScanRow[];
};

export const fetchUserDomains = async (userId: string): Promise<DomainRow[]> => {
  const supabase = getClient();

  const { data, error } = await supabase
    .from("domains")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch domains: ${error.message}`);
  }

  return (data ?? []) as DomainRow[];
};

export const fetchLatestScanForDomain = async (
  domainId: string
): Promise<ScanRow | null> => {
  const supabase = getClient();

  const { data, error } = await supabase
    .from("scans")
    .select("*")
    .eq("domain_id", domainId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch latest scan: ${error.message}`);
  }

  return (data as ScanRow | null) ?? null;
};
