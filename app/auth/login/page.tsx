import Link from "next/link";

import { EmailLoginForm } from "@/components/auth/email-login-form";
import { getOptionalUser } from "@/lib/auth/server";

export default async function LoginPage() {
  const { user } = await getOptionalUser();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-slate-100">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-white">Sign in to DNSweeper</h1>
          <p className="mt-2 text-sm text-slate-400">
            {user
              ? "You are already signed in. Continue to the app."
              : "Use email magic link or Google OAuth."
            }
          </p>
          <div className="mt-4">
            <Link
              href={user ? "/app" : "/"}
              className="text-sm text-indigo-400 hover:text-indigo-300"
            >
              {user ? "Go to dashboard" : "Return to landing"}
            </Link>
          </div>
        </div>
        {!user && <EmailLoginForm />}
      </div>
    </div>
  );
}
