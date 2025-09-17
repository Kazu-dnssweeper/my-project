import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const requireUser = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return { user, supabase };
};

export const getOptionalUser = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { user, supabase };
};
