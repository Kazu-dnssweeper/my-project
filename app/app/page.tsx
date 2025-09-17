import Link from "next/link";

import { requireUser } from "@/lib/auth/server";

type DomainWithScan = {
  id: string;
  domain_name: string;
  last_scan: string | null;
  scans: { result: Record<string, unknown> | null; created_at: string }[];
};

export default async function DashboardPage() {
  const { supabase } = await requireUser();

  const { data } = await supabase
    .from("domains")
    .select(
      `id, domain_name, last_scan, scans(limit=1, order=created_at.desc, result, created_at)`
    )
    .order("created_at", { ascending: true });

  const domains = (data ?? []) as unknown as DomainWithScan[];

  const domainCount = domains.length;
  const lastScan = domains.at(0)?.last_scan ?? null;
  const totalGarbage = domains.reduce((acc, domain) => {
    const scan = domain.scans.at(0);
    const summary = (scan?.result as { summary?: { garbageCount?: number } } | null)
      ?.summary;
    return acc + (summary?.garbageCount ?? 0);
  }, 0);

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-white">Dashboard</h1>
        <p className="text-sm text-slate-400">
          Keep track of your domains, latest scans, and garbage cleanup wins.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Tracked domains" value={domainCount.toString()} />
        <MetricCard
          label="Garbage records flagged"
          value={totalGarbage.toString()}
        />
        <MetricCard
          label="Last scan"
          value={lastScan ? new Date(lastScan).toLocaleString() : "Not yet"}
        />
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Domains</h2>
          <Link
            href="/app/scan"
            className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
          >
            New scan
          </Link>
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead className="bg-slate-900/80 text-left text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Domain</th>
                <th className="px-4 py-3">Last scan</th>
                <th className="px-4 py-3">Garbage flagged</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {domains.length ? (
                domains.map((domain) => {
                  const scan = domain.scans.at(0);
                  const summary = (scan?.result as {
                    summary?: { garbageCount?: number };
                  } | null)?.summary;
                  return (
                    <tr key={domain.id} className="hover:bg-slate-900/70">
                      <td className="px-4 py-3 font-medium text-white">
                        {domain.domain_name}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {domain.last_scan
                          ? new Date(domain.last_scan).toLocaleString()
                          : "Not yet"}
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        {summary?.garbageCount ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/app/history?domain=${encodeURIComponent(domain.id)}`}
                          className="text-sm text-indigo-400 hover:text-indigo-300"
                        >
                          View history
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="px-4 py-6 text-center text-slate-400" colSpan={4}>
                    No domains tracked yet. Run your first scan to populate this list.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}

const MetricCard = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6">
    <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
  </div>
);
