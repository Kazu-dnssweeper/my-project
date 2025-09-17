import { CheckoutButton } from "@/components/settings/checkout-button";
import { requireUser } from "@/lib/auth/server";

const disclaimer = `【重要】DNSweeperの判定について\n\n• 本ツールは「ゴミの可能性がある」レコードを提示します\n• 削除の最終判断は必ずお客様自身で行ってください\n• 削除前に以下を必ず確認してください：\n  - 社内システムでの利用有無\n  - 外部サービスとの連携\n  - 季節的・一時的な利用\n  - バックアップ・災害対策用途\n\n• 削除による影響は弊社では責任を負いかねます\n• 不明な場合は削除せず、社内のIT部門にご相談ください`;

export default async function SettingsPage() {
  const { supabase, user } = await requireUser();

  const { data } = await supabase
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", user.id)
    .maybeSingle();

  const currentStatus = data?.status ?? "free";
  const renewalDate = data?.current_period_end
    ? new Date(data.current_period_end).toLocaleDateString()
    : "--";

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold text-white">Account & Billing</h1>
        <p className="text-sm text-slate-400">
          Manage your subscription and review the safety checklist before deleting DNS records.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-lg font-semibold text-white">Current plan</h2>
          <p className="mt-2 text-sm text-slate-300">
            Status: <span className="font-medium text-white">{currentStatus}</span>
          </p>
          <p className="mt-1 text-sm text-slate-300">Next renewal: {renewalDate}</p>
          <p className="mt-4 text-sm text-slate-400">
            Upgrade to unlock unlimited scans, exports, and email alerts.
          </p>
          <div className="mt-4">
            <CheckoutButton />
          </div>
        </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h2 className="text-lg font-semibold text-white">Safety checklist</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-300">
          {disclaimer}
        </p>
      </div>
      </div>
    </section>
  );
}
