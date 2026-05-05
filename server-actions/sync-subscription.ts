"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

// Reconciles the public.subscriptions row for the current authed user with
// Stripe. Used when the DB is out of sync (row missing / stripe_status stale)
// but Stripe still reports an active subscription — /api/stripe/checkout
// 409s in that state, and we want /local to auto-heal rather than surface
// an error card.
export async function syncSubscriptionFromStripe(): Promise<{
  ok: boolean;
  error?: string;
}> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, error: "Not authenticated" };

  const stripe = getStripe();
  const customers = await stripe.customers.list({ email: user.email, limit: 1 });
  const customer = customers.data[0];
  if (!customer) return { ok: false, error: "No Stripe customer" };

  const subs = await stripe.subscriptions.list({
    customer: customer.id,
    status: "active",
    limit: 1,
  });
  const sub = subs.data[0];
  if (!sub) return { ok: false, error: "No active Stripe subscription" };

  const proPriceId = process.env.STRIPE_PRO_PRICE_ID
  const tier = sub.items.data.some((i) => i.price.id === proPriceId) ? 'pro' : 'free'

  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("subscriptions").upsert(
    {
      contact: user.email,
      stripe_customer_id: customer.id,
      stripe_subscription_id: sub.id,
      stripe_status: "active",
      tier,
    },
    { onConflict: "contact" },
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
