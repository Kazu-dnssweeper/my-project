import Stripe from "stripe";

import { env } from "@/lib/env";
import { requiredServerEnv } from "@/lib/env";

let stripeClient: Stripe | null = null;

export const getStripeClient = () => {
  if (!stripeClient) {
    const secret = env.STRIPE_SECRET_KEY ?? requiredServerEnv.stripeSecretKey;
    stripeClient = new Stripe(secret, {
      apiVersion: "2025-08-27.basil" as const,
    });
  }

  return stripeClient;
};
