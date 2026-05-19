"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"

export type SupportedRegion = {
  region: string
  type: string
  parent_region: string | null
}

export async function getSupportedRegions(): Promise<string[]> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from("regions")
    .select("region")
    .order("region")

  return data?.map((row) => row.region) ?? []
}

export async function getSupportedRegionsWithHierarchy(): Promise<SupportedRegion[]> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from("regions")
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
