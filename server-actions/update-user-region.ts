"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

export async function updateUserRegion(region: string): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) return { error: "Unauthorized" }

  const admin = createSupabaseAdminClient()

  // Look up the selected region and determine its type.
  const { data: regionRow } = await admin
    .from("supported_regions")
    .select("region, type, parent_region")
    .eq("region", region)
    .maybeSingle()

  if (!regionRow) return { error: "Region not found." }

  // City-level regions require a Pro subscription.
  if (regionRow.type === "city") {
    const { data: sub } = await admin
      .from("subscriptions")
      .select("tier")
      .eq("contact", user.email)
      .maybeSingle()

    if (sub?.tier !== "pro") {
      return { error: "City-level updates require a Pro subscription." }
    }
  }

  const { error } = await admin
    .from("subscriptions")
    .update({ region })
    .eq("contact", user.email)

  if (error) return { error: error.message }

  // Rebuild subscription_regions by walking up the parent chain from the
  // selected region so the stored coverage levels stay in sync.
  const hierarchy: { region: string; type: string }[] = [
    { region: regionRow.region, type: regionRow.type },
  ]
  let current = regionRow
  while (current.parent_region) {
    const { data: parent } = await admin
      .from("supported_regions")
      .select("region, type, parent_region")
      .eq("region", current.parent_region)
      .maybeSingle()
    if (!parent) break
    hierarchy.push({ region: parent.region, type: parent.type })
    current = parent
  }

  // Free users: strip city entries.
  const isPro = regionRow.type === "city"
    // We already validated Pro above — if we reached here with a city, they're Pro.
    ? true
    : (await admin.from("subscriptions").select("tier").eq("contact", user.email).maybeSingle()).data?.tier === "pro"

  const regionsToSave = isPro
    ? hierarchy
    : hierarchy.filter((r) => r.type !== "city")

  await admin
    .from("subscription_regions")
    .delete()
    .eq("subscription_id", user.email)

  if (regionsToSave.length > 0) {
    await admin
      .from("subscription_regions")
      .insert(regionsToSave.map((r) => ({ subscription_id: user.email, region: r.region })))
  }

  return {}
}
