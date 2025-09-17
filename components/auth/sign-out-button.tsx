"use client";

import { useTransition } from "react";

import { signOut } from "@/lib/auth/actions";

export const SignOutButton = () => {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="rounded-md border border-slate-700 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-800 disabled:opacity-50"
      onClick={() => startTransition(() => signOut())}
      disabled={isPending}
    >
      {isPending ? "Signing out..." : "Sign out"}
    </button>
  );
};
