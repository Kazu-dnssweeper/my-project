import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirectTo = requestUrl.searchParams.get("redirect_to") ?? "/app";

  if (!code) {
    return NextResponse.redirect(new URL(`/auth/login?error=missing_code`, request.url));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }

  return NextResponse.redirect(new URL(redirectTo, request.url));
}
