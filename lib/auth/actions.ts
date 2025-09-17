"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export const signOut = async () => {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/app");
  redirect("/");
};
