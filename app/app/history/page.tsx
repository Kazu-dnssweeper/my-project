import Link from "next/link";

import { ExportButtons } from "@/components/history/export-buttons";
import { requireUser } from "@/lib/auth/server";
import type { DomainAnalysisResult } from "@/lib/types/dns";

type HistoryPageProps = {
  searchParams?: { domain?: string };
};

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const params = searchParams ?? {};
  const { supabase } = await requireUser();

  const { data: domainRows } = await supabase
    .from("domains")
    .select("id, domain_name")
    .order("created_at", { ascending: true });

  const domains = (domainRows ?? []) as { id: string; domain_name: string }[];

  const selectedDomain = params.domain ?? domains.at(0)?.id ?? null;

  const scanQuery = selectedDomain
    ? await supabase
        .from("scans")
        .select("id, created_at, garbage_count, total_records, result")
        .eq("domain_id", selectedDomain)
        .order("created_at", { ascending: false })
    : { data: [] as unknown[] };

  const history = (scanQuery.data ?? []) as {
    id: string;
    created_at: string | null;
    garbage_count: number | null;
    total_records: number | null;
    result: DomainAnalysisResult | null;
  }[];

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-white">Scan history</h1>
        <p className="text-sm text-slate-400">
          Review previous scan results, export data, and monitor your cleanup progress.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {domains.map((domain) => {
          const isActive = domain.id === selectedDomain;
          return (
            <Link
              key={domain.id}
              href={`/app/history?domain=${domain.id}`}
              className={`rounded-md px-3 py-1 text-sm transition ${
                isActive
                  ? "bg-indigo-500 text-white"
                  : "border border-slate-700 text-slate-300 hover:border-indigo-400 hover:text-white"
              }`}
            >
              {domain.domain_name}
            </Link>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-900/80 text-left text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Total records</th>
              <th className="px-4 py-3">Garbage</th>
              <th className="px-4 py-3">Estimated savings</th>
              <th className="px-4 py-3">Export</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {history.length ? (
              history.map((scan) => {
                const summary = scan.result?.summary;
                return (
                  <tr key={scan.id} className="hover:bg-slate-900/70">
                    <td className="px-4 py-3 text-slate-200">
                      {scan.created_at
                        ? new Date(scan.created_at).toLocaleString()
                        : "--"}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {summary?.totalRecords ?? scan.total_records ?? "--"}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {summary?.garbageCount ?? scan.garbage_count ?? "--"}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {scan.result
                        ? `$${scan.result.estimatedMonthlySavings.toFixed(2)}/mo`
                        : "--"}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {scan.result ? (
                        <ExportButtons result={scan.result} />
                      ) : (
                        "--"
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="px-4 py-6 text-center text-slate-400" colSpan={5}>
                  No scans yet. Run your first scan to see history.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
