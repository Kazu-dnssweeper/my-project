import { NextResponse } from "next/server";

import { analyzeDomain } from "@/lib/dns/analyzer";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import {
  insertScanResult,
  upsertDomainForUser,
} from "@/lib/supabase/queries";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: { domain?: string };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  if (!payload.domain) {
    return NextResponse.json(
      { error: "Domain is required" },
      { status: 400 }
    );
  }

  try {
    const analysis = await analyzeDomain(payload.domain);
    const domainRecord = await upsertDomainForUser(user.id, payload.domain);
    await insertScanResult(user.id, domainRecord.id, analysis);

    return NextResponse.json(analysis);
  } catch (error) {
    console.error("DNS scan failed", error);
    return NextResponse.json(
      {
        error: "Failed to analyze domain",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
