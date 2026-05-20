"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { getStripe } from "@/lib/stripe"
import { submitRegionWaitlist } from "@/server-actions/request-region"

function parseRegionRequest(raw: string | undefined): { region: string } | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  // Legacy in-flight sessions encoded this as "country|state|city" — keep only the last segment.
  const region = trimmed.includes("|") ? trimmed.split("|").pop()!.trim() : trimmed
  if (!region) return null
  return { region }
}

export async function fulfillCheckout(sessionId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { success: false, error: "Not authenticated" }

  let session
  try {
    session = await getStripe().checkout.sessions.retrieve(sessionId)
  } catch {
    return { success: false, error: "Invalid session" }
  }

  if (session.mode !== "subscription") {
    return { success: false, error: "Session not completed" }
  }

  if (session.status !== "complete") {
    return { success: false, error: "Session not completed" }
  }

  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
    return { success: false, error: "Session not completed" }
  }

  if (session.metadata?.contact !== user.email) {
    return { success: false, error: "Session mismatch" }
  }

  const metadata = session.metadata ?? {}
  const region = typeof metadata.region === "string" ? metadata.region.trim() : ""
  const regionsRaw = typeof metadata.regions === "string" ? metadata.regions : ""
  const regions = regionsRaw.split("|").map((r) => r.trim()).filter(Boolean)
  const topicsRaw = typeof metadata.topics === "string" ? metadata.topics : ""
  const topics = topicsRaw
    .split("|")
    .map((t) => t.trim())
    .filter(Boolean)

  const admin = createSupabaseAdminClient()

  // Check whether we've already fulfilled this session so we can skip
  // non-idempotent side effects (admin emails, referral conversions).
  // The upsert itself always runs — it's idempotent and ensures the
  // webhook-created row (which may lack region / stripe_period_end) gets
  // the complete data from the checkout session.
  const { data: existingRow } = await admin
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("contact", user.email)
    .maybeSingle()

  const alreadyFulfilled = existingRow?.stripe_subscription_id === session.subscription

  // Fetch the subscription to get stripe_period_end and determine tier
  // from actual price IDs (authoritative) rather than metadata.
  let periodEnd: string | undefined
  let plan: "pro" | "free" = metadata.plan === "pro" ? "pro" : "free"
  const proPriceId = process.env.STRIPE_PRO_PRICE_ID
  try {
    const stripeSub = await getStripe().subscriptions.retrieve(session.subscription as string)
    const ts = stripeSub.items.data[0]?.current_period_end
    if (ts) periodEnd = new Date(ts * 1000).toISOString()
    if (proPriceId) {
      plan = stripeSub.items.data.some((i) => i.price.id === proPriceId) ? "pro" : "free"
    }
  } catch {
    // Non-fatal — webhook will fill stripe_period_end shortly.
  }

  const maxTopics = 3
  const truncatedTopics = topics.slice(0, maxTopics)

  const upsertPayload: Record<string, string> = {
    contact: user.email,
    stripe_customer_id: session.customer as string,
    stripe_subscription_id: session.subscription as string,
    stripe_status: "active",
    tier: plan,
  }
  if (region) upsertPayload.region = region
  if (periodEnd) upsertPayload.stripe_period_end = periodEnd

  const { error } = await admin
    .from("subscriptions")
    .upsert(upsertPayload, { onConflict: "contact" })

  if (error) {
    console.error("fulfillCheckout: DB upsert failed:", error)
    return { success: false, error: "Failed to save subscription" }
  }

  // Topics are idempotent (delete + insert) — always run so they're saved even
  // when the webhook created the row before fulfillCheckout reached this point.
  if (truncatedTopics.length > 0) {
    const normalized = truncatedTopics.map((t) => t.toLowerCase())
    const { data: topicRows } = await admin
      .from("supported_topics")
      .select("topic_id, topic_name")
      .in("topic_name", normalized)

    await admin
      .from("subscription_topics")
      .delete()
      .eq("subscription_id", user.email)

    if (topicRows && topicRows.length > 0) {
      await admin
        .from("subscription_topics")
        .insert(topicRows.map((row) => ({ subscription_id: user.email, topic_id: row.topic_id })))
    }
  }

  // Regions are idempotent (delete + insert) — always run so they're saved
  // even when the webhook created the row before fulfillCheckout reached this point.
  if (regions.length > 0) {
    await admin
      .from("subscription_regions")
      .delete()
      .eq("subscription_id", user.email)

    await admin
      .from("subscription_regions")
      .insert(regions.map((r) => ({ subscription_id: user.email, region: r })))
  }

  // Non-idempotent side effects — only run on first fulfillment to avoid
  // duplicate vote counts and referral conversions.
  if (alreadyFulfilled) return { success: true }

  const regionRequest = parseRegionRequest(metadata.region_request)
  if (regionRequest) {
    const referralCode = typeof metadata.referral_code === "string" ? metadata.referral_code.trim() : ""
    await submitRegionWaitlist({
      region: regionRequest.region,
      voterEmail: user.email,
      referralCode: referralCode || undefined,
    })
  }

  return { success: true }
}
