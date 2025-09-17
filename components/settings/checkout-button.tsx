"use client";

import { useTransition } from "react";

export const CheckoutButton = () => {
  const [isPending, startTransition] = useTransition();

  const startCheckout = async () => {
    startTransition(async () => {
      const response = await fetch("/api/subscription/create-checkout", {
        method: "POST",
      });
      if (!response.ok) {
        console.error("Failed to create checkout session");
        return;
      }
      const data = (await response.json()) as { url?: string };
      if (data.url) {
        window.location.href = data.url;
      }
    });
  };

  return (
    <button
      type="button"
      onClick={startCheckout}
      disabled={isPending}
      className="rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-60"
    >
      {isPending ? "Redirecting..." : "Upgrade to Pro"}
    </button>
  );
};
