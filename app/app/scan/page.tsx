import { ScanForm } from "@/components/scan/scan-form";
import { requireUser } from "@/lib/auth/server";

export default async function ScanPage() {
  const { supabase } = await requireUser();

  const { data } = await supabase
    .from("domains")
    .select("id, domain_name")
    .order("created_at", { ascending: true });

  const savedDomains = (data ?? []) as { id: string; domain_name: string }[];

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-white">Run a new scan</h1>
        <p className="text-sm text-slate-400">
          Provide a Cloudflare-managed domain to detect dead subdomains, broken CNAMEs,
          staging leftovers, duplicate records, and wildcard conflicts.
        </p>
      </header>
      <ScanForm savedDomains={savedDomains} />
    </section>
  );
}
