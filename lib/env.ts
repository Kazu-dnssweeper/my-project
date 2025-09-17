import { z } from "zod";

const baseSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY cannot be empty"),
  SUPABASE_SERVICE_KEY: z
    .string()
    .min(1, "SUPABASE_SERVICE_KEY cannot be empty")
    .optional(),
  CLOUDFLARE_API_TOKEN: z.string().min(1).optional(),
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_PRICE_ID: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
});

const parsed = baseSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
  CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_PRICE_ID: process.env.STRIPE_PRICE_ID,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
});

if (!parsed.success) {
  const errors = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("\n");

  throw new Error(`Invalid environment variables:\n${errors}`);
}

export const env = parsed.data;

export const requiredServerEnv = {
  get supabaseServiceRoleKey() {
    if (!env.SUPABASE_SERVICE_KEY) {
      throw new Error("SUPABASE_SERVICE_KEY is required for server-side operations");
    }
    return env.SUPABASE_SERVICE_KEY;
  },
  get cloudflareApiToken() {
    if (!env.CLOUDFLARE_API_TOKEN) {
      throw new Error("CLOUDFLARE_API_TOKEN is required to scan Cloudflare domains");
    }
    return env.CLOUDFLARE_API_TOKEN;
  },
  get stripeSecretKey() {
    if (!env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is required for Stripe integration");
    }
    return env.STRIPE_SECRET_KEY;
  },
  get stripePriceId() {
    if (!env.STRIPE_PRICE_ID) {
      throw new Error("STRIPE_PRICE_ID is required for Stripe Checkout sessions");
    }
    return env.STRIPE_PRICE_ID;
  },
  get stripeWebhookSecret() {
    if (!env.STRIPE_WEBHOOK_SECRET) {
      throw new Error("STRIPE_WEBHOOK_SECRET is required for Stripe webhook validation");
    }
    return env.STRIPE_WEBHOOK_SECRET;
  },
};
