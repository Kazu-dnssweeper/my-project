import { NextResponse } from "next/server";

import { getStripeClient } from "@/lib/stripe/client";
import { createSupabaseRouteClient } from "@/lib/supabase/server";
import { requiredServerEnv } from "@/lib/env";

export async function POST(request: Request) {
  const supabase = await createSupabaseRouteClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const origin = request.headers.get("origin") ?? "https://dnsweeper.dev";

  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: requiredServerEnv.stripePriceId,
          quantity: 1,
        },
      ],
      customer_email: user.email ?? undefined,
      metadata: {
        user_id: user.id,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
        },
      },
      success_url: `${origin}/app/settings?checkout=success`,
      cancel_url: `${origin}/app/settings?checkout=canceled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout creation failed", error);
    return NextResponse.json(
      {
        error: "Unable to create checkout session",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
