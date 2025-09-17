import Link from "next/link";

import { getOptionalUser } from "@/lib/auth/server";

export default async function LandingPage() {
  const { user } = await getOptionalUser();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-24">
        <header className="flex flex-col gap-6 text-center">
          <span className="mx-auto w-fit rounded-full border border-slate-700 px-4 py-1 text-xs uppercase tracking-[0.2em] text-slate-400">
            DNS Cleanup MVP
          </span>
          <h1 className="text-4xl font-semibold leading-tight text-white md:text-6xl">
            Find DNS garbage before it costs you money or uptime
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-slate-300">
            DNSweeper analyzes your Cloudflare zones, flags dead subdomains, broken
            CNAMEs, forgotten staging sites, redundant records, and wildcard conflicts.
            Export actionable reports and keep your records lean in minutes.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Link
              href={user ? "/app/scan" : "/auth/login"}
              className="rounded-md bg-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-indigo-400"
            >
              {user ? "Start a scan" : "Sign in to start"}
            </Link>
            <Link
              href="#features"
              className="rounded-md border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
            >
              View features
            </Link>
          </div>
        </header>

        <section id="features" className="grid gap-6 md:grid-cols-2">
          {featureList.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/40"
            >
              <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{feature.description}</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-400">
                {feature.points.map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-2 w-2 flex-shrink-0 rounded-full bg-indigo-400" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
          <h2 className="text-2xl font-semibold text-white">Pricing built for indie ops</h2>
          <p className="mt-3 text-sm text-slate-300">
            Track one domain for free, upgrade to automate scans and unlock exports.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-left">
            <div className="min-w-[220px] rounded-xl border border-slate-800 bg-slate-950/80 p-6">
              <h3 className="text-lg font-semibold text-white">Free</h3>
              <p className="mt-2 text-3xl font-bold text-white">$0</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                <li>5 scans / month</li>
                <li>1 domain tracked</li>
                <li>Manual CSV export</li>
              </ul>
            </div>
            <div className="min-w-[220px] rounded-xl border border-indigo-500 bg-indigo-500/10 p-6">
              <h3 className="text-lg font-semibold text-white">Pro</h3>
              <p className="mt-2 text-3xl font-bold text-white">$19</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-100">
                <li>Unlimited scans & domains</li>
                <li>CSV & PDF exports</li>
                <li>Email alerts</li>
              </ul>
            </div>
          </div>
        </section>

        <footer className="flex flex-col items-center gap-3 text-sm text-slate-400">
          <p>© {new Date().getFullYear()} DNSweeper. Crafted for indie infrastructure teams.</p>
          <div className="flex gap-3">
            <Link href="/auth/login" className="hover:text-slate-200">
              Login
            </Link>
            <Link href="/app" className="hover:text-slate-200">
              App
            </Link>
            <Link href="mailto:hello@dnsweeper.dev" className="hover:text-slate-200">
              Support
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}

const featureList = [
  {
    title: "Dead subdomain detection",
    description:
      "We resolve DNS, check HTTP/S responses, and probe common ports to confidently flag dead infrastructure.",
    points: [
      "NXDOMAIN and timeout detection",
      "HTTP HEAD checks with fallbacks",
      "Confidence scoring for each suspect record",
    ],
  },
  {
    title: "Smarter test record cleanup",
    description:
      "Pattern matching catches staging and temporary records, while liveness checks avoid deleting active sandboxes.",
    points: [
      "Regex heuristics for common prefixes",
      "Confidence adjustments for active hosts",
      "Actionable suggestions for each match",
    ],
  },
  {
    title: "Duplicate & wildcard auditing",
    description:
      "We reveal redundant DNS entries and conflicts with wildcard records to reduce maintenance overhead.",
    points: [
      "Priority ranking for duplicate resolution",
      "Wildcard coverage comparisons",
      "Structured export for follow-up",
    ],
  },
  {
    title: "Integrates with your stack",
    description:
      "Supabase stores history, Stripe powers subscriptions, and Cloudflare API keeps the setup lightweight.",
    points: [
      "Secure Supabase Auth",
      "Usage history & savings estimate",
      "Export-ready reports for leadership",
    ],
  },
];
