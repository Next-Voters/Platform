"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"

export async function getSubscriptionStatus(): Promise<{
  isPro: boolean;
  isAuthenticated: boolean;
  hasSubscription: boolean;
  tier: 'pro' | 'free' | 'none';
}> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) {
    return { isPro: false, isAuthenticated: false, hasSubscription: false, tier: 'none' }
  }

  // Source of truth: the subscriptions row written by fulfillCheckout.
  // tier column is written at subscription creation/update time — no Stripe call needed.
  const admin = createSupabaseAdminClient()
  const { data: row } = await admin
    .from("subscriptions")
    .select("stripe_subscription_id, stripe_status, tier")
    .eq("contact", user.email)
    .maybeSingle()

  if (!row || !row.stripe_subscription_id || row.stripe_status !== "active") {
    return { isPro: false, isAuthenticated: true, hasSubscription: false, tier: 'none' }
  }

  const isPro = row.tier === 'pro'
  return {
    isPro,
    isAuthenticated: true,
    hasSubscription: true,
    tier: isPro ? 'pro' : 'free',
  }
}
