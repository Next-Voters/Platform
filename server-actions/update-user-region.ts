"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

export async function updateUserRegion(region: string): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) return { error: "Unauthorized" }

  const admin = createSupabaseAdminClient()
  const { error } = await admin
    .from("subscriptions")
    .update({ region })
    .eq("contact", user.email)

  if (error) return { error: error.message }
  return {}
}
