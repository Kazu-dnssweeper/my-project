import { requiredServerEnv } from "@/lib/env";
import type { DNSRecord } from "@/lib/types/dns";

const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";

type CloudflareResponse<T> = {
  success: boolean;
  errors: { code: number; message: string }[];
  result: T;
  result_info?: {
    page: number;
    per_page: number;
    total_count: number;
  };
};

type CloudflareZone = {
  id: string;
  name: string;
};

type CloudflareDNSRecord = {
  id: string;
  zone_id: string;
  zone_name: string;
  name: string;
  type: string;
  content: string;
  ttl?: number;
  proxied?: boolean;
};

const cfFetch = async <T>(input: string, init?: RequestInit) => {
  const url = `${CLOUDFLARE_API_BASE}${input}`;

  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${requiredServerEnv.cloudflareApiToken}`,
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Cloudflare request failed (${response.status}): ${text}`);
  }

  const json = (await response.json()) as CloudflareResponse<T>;
  if (!json.success) {
    const errorMessages = json.errors.map((err) => err.message).join(", ");
    throw new Error(`Cloudflare API error: ${errorMessages}`);
  }

  return json;
};

const findZoneId = async (domain: string) => {
  const data = await cfFetch<CloudflareZone[]>(
    `/zones?name=${encodeURIComponent(domain)}`
  );
  const zone = data.result.at(0);

  if (!zone) {
    throw new Error(`No Cloudflare zone found for ${domain}`);
  }

  return zone;
};

export const fetchDNSRecords = async (domain: string) => {
  const zone = await findZoneId(domain);

  const records: DNSRecord[] = [];
  let page = 1;
  const perPage = 100;
  let totalPages = 1;

  while (page <= totalPages) {
    const { result, result_info } = await cfFetch<CloudflareDNSRecord[]>(
      `/zones/${zone.id}/dns_records?page=${page}&per_page=${perPage}`
    );

    records.push(
      ...result.map((record) => ({
        id: record.id,
        zone_id: record.zone_id,
        zone_name: record.zone_name,
        name: record.name,
        type: record.type as DNSRecord["type"],
        content: record.content,
        ttl: record.ttl,
        proxied: record.proxied,
      }))
    );

    if (result_info) {
      const totalCount = result_info.total_count ?? result.length;
      totalPages = Math.max(1, Math.ceil(totalCount / result_info.per_page));
    }

    page += 1;
  }

  return { zone, records };
};
