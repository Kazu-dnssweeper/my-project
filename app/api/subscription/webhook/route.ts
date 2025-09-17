import { NextResponse } from "next/server";
import Stripe from "stripe";

import { requiredServerEnv } from "@/lib/env";
import { getStripeClient } from "@/lib/stripe/client";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type { Database } from "@/lib/types/database";

type SubscriptionInsert = Database["public"]["Tables"]["subscriptions"]["Insert"];

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.arrayBuffer();

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(
      Buffer.from(rawBody),
      signature,
      requiredServerEnv.stripeWebhookSecret
    );
  } catch (error) {
    console.error("Stripe webhook verification failed", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createSupabaseServiceRoleClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        if (userId) {
          const payload: SubscriptionInsert = {
            user_id: userId,
            stripe_customer_id: session.customer?.toString() ?? null,
            stripe_subscription_id: session.subscription?.toString() ?? null,
            status: session.status ?? null,
          };
          await supabase.from("subscriptions").upsert(payload, { onConflict: "user_id" });
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.created":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.user_id;
        if (userId) {
          const rawPeriodEnd =
            (subscription as { current_period_end?: number }).current_period_end ??
            null;
          const payload: SubscriptionInsert = {
            user_id: userId,
            stripe_customer_id: subscription.customer?.toString() ?? null,
            stripe_subscription_id: subscription.id,
            status: subscription.status ?? null,
            current_period_end: rawPeriodEnd
              ? new Date(rawPeriodEnd * 1000).toISOString()
              : null,
          };
          await supabase.from("subscriptions").upsert(payload, { onConflict: "user_id" });
        }
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error("Failed to process Stripe event", error);
    return NextResponse.json(
      { received: true, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
