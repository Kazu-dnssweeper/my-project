"use client";

import { useMemo, useState } from "react";
import { z } from "zod";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});

type Status = "idle" | "loading" | "success" | "error";

export const EmailLoginForm = () => {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      setStatus("error");
      setMessage(parsed.error.issues[0]?.message ?? "Invalid email");
      return;
    }

    setStatus("loading");
    setMessage(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.data.email,
      options: {
        emailRedirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/app`
            : undefined,
      },
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }

    setStatus("success");
    setMessage(
      "Check your inbox for a magic link to access DNSweeper."
    );
  };

  const signInWithGoogle = async () => {
    setStatus("loading");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo:
          typeof window !== "undefined"
            ? `${window.location.origin}/auth/callback`
            : undefined,
      },
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    setMessage("Redirecting to Google...");
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-6"
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-sm font-medium text-slate-200">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          placeholder="you@example.com"
          className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        />
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-60"
      >
        {status === "loading" ? "Sending link..." : "Send magic link"}
      </button>

      <div className="relative my-2 h-px bg-slate-800">
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 px-2 text-xs uppercase tracking-wide text-slate-500">
          or
        </span>
      </div>

      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={status === "loading"}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-indigo-400 hover:text-white disabled:opacity-60"
      >
        Continue with Google
      </button>

      {message && (
        <p
          className={`text-sm ${
            status === "error" ? "text-rose-400" : "text-slate-300"
          }`}
        >
          {message}
        </p>
      )}
    </form>
  );
};
