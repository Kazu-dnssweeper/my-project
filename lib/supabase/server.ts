import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { env } from "@/lib/env";
import type { Database } from "@/lib/types/database";

const buildClient = async () => {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        async getAll() {
          const all = cookieStore.getAll();
          return all.map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
          }));
        },
        async setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              if (process.env.NODE_ENV !== "production") {
                console.warn("Unable to set cookie on server", error);
              }
            }
          });
        },
      },
    }
  );
};

export const createSupabaseServerClient = async () => buildClient();
export const createSupabaseRouteClient = async () => buildClient();
