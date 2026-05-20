"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { RegionType } from "@/types/supported-regions"

export type SupportedRegion = {
  region: string
  type: RegionType
  parent_region: string | null
}

export async function getSupportedRegions(): Promise<string[]> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from("supported_regions")
    .select("region")
    .order("region")

  return data?.map((row) => row.region) ?? []
}

export async function getSupportedRegionsWithHierarchy(): Promise<SupportedRegion[]> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from("supported_regions")
    .select("region, type, parent_region")
    .order("region")

  return (data as SupportedRegion[] | null) ?? []
}

export async function getUserRegion(): Promise<string | null> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) return null

  const { data } = await supabase
    .from("subscriptions")
    .select("region")
    .eq("contact", user.email)
    .maybeSingle()

  return data?.region ?? null
}

/** Fetch all regions the current user is subscribed to, with type info. */
export async function getUserSubscriptionRegions(): Promise<SupportedRegion[]> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) return []

  const { data: rows } = await supabase
    .from("subscription_regions")
    .select("region")
    .eq("subscription_id", user.email)

  if (!rows || rows.length === 0) return []

  const regionNames = rows.map((r) => r.region)
  const { data: regionDetails } = await supabase
    .from("supported_regions")
    .select("region, type, parent_region")
    .in("region", regionNames)

  return (regionDetails as SupportedRegion[] | null) ?? []
}
