import { createClient } from "@supabase/supabase-js";

import { env, requiredServerEnv } from "@/lib/env";
import type { Database } from "@/lib/types/database";

export const createSupabaseServiceRoleClient = () =>
  createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    requiredServerEnv.supabaseServiceRoleKey,
    {
      auth: {
        persistSession: false,
      },
    }
  );
