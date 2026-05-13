"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function getRegionVoteCount(region: string): Promise<number> {
  const trimmed = region?.trim();
  if (!trimmed) return 0;

  try {
    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from("region_requests")
      .select("vote_count")
      .eq("region", trimmed)
      .maybeSingle();
    return data?.vote_count ?? 0;
  } catch {
    return 0;
  }
}
