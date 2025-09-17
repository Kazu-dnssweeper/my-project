import type { ReactNode } from "react";

import { AppNav } from "@/components/navigation/app-nav";
import { requireUser } from "@/lib/auth/server";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireUser();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <AppNav />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
        {children}
      </main>
    </div>
  );
}
