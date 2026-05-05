"use server"

import { createSupabaseServerClient } from "@/lib/supabase/server"
import { createSupabaseAdminClient } from "@/lib/supabase/admin"
import { getStripe } from "@/lib/stripe"
import { submitRegionWaitlist } from "@/server-actions/request-region"

function parseCityRequest(raw: string | undefined): { city: string } | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (!trimmed) return null
  // Legacy in-flight sessions encoded this as "country|state|city" — keep only the city segment.
  const city = trimmed.includes("|") ? trimmed.split("|").pop()!.trim() : trimmed
  if (!city) return null
  return { city }
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

  if (session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
    return { success: false, error: "Session not completed" }
  }

  if (session.metadata?.contact !== user.email) {
    return { success: false, error: "Session mismatch" }
  }

  const metadata = session.metadata ?? {}
  const plan = metadata.plan === "pro" ? "pro" : "free"
  const city = typeof metadata.city === "string" ? metadata.city.trim() : ""
  const language = typeof metadata.language === "string" ? metadata.language.trim() : ""
  const topicsRaw = typeof metadata.topics === "string" ? metadata.topics : ""
  const topics = topicsRaw
    .split("|")
    .map((t) => t.trim())
    .filter(Boolean)
  const maxTopics = plan === "pro" ? 3 : 1
  const truncatedTopics = topics.slice(0, maxTopics)

  const admin = createSupabaseAdminClient()

  // Idempotency: if we've already fulfilled this exact session for this user,
  // short-circuit so we don't re-send admin emails or re-convert referrals
  // (submitRegionWaitlist below is not idempotent).
  const { data: existingRow } = await admin
    .from("subscriptions")
    .select("stripe_subscription_id")
    .eq("contact", user.email)
    .maybeSingle()

  if (existingRow?.stripe_subscription_id === session.subscription) {
    return { success: true }
  }

  const upsertPayload: Record<string, string> = {
    contact: user.email,
    stripe_customer_id: session.customer as string,
    stripe_subscription_id: session.subscription as string,
    stripe_status: "active",
    tier: plan,
  }
  if (city) upsertPayload.city = city
  if (language) upsertPayload.preferred_language = language

  const { error } = await admin
    .from("subscriptions")
    .upsert(upsertPayload, { onConflict: "contact" })

  if (error) return { success: false, error: error.message }

  // Persist topics to subscription_topics (replace any prior selections).
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

  // If the user requested an unsupported city, notify admin + convert any referral.
  const cityRequest = parseCityRequest(metadata.city_request)
  if (cityRequest) {
    const referralCode = typeof metadata.referral_code === "string" ? metadata.referral_code.trim() : ""
    await submitRegionWaitlist({
      city: cityRequest.city,
      referralCode: referralCode || undefined,
    })
  }

  return { success: true }
}
