import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { submitRegionWaitlist } from '@/server-actions/request-region';

interface RegionRequestBody {
  region?: unknown;
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const plan = body.plan === 'pro' ? 'pro' : 'free';

  const rawRegion = typeof body.region === 'string' ? body.region.trim() : '';
  const rawTopics: string[] = Array.isArray(body.topics)
    ? body.topics.filter((t: unknown): t is string => typeof t === 'string' && t.trim().length > 0).map((t: string) => t.trim())
    : [];

  if (!rawRegion) {
    return NextResponse.json({ error: 'Please select a region.' }, { status: 400 });
  }
  if (rawTopics.length === 0) {
    return NextResponse.json({ error: 'Please select at least one topic.' }, { status: 400 });
  }

  const regionRequest = body.regionRequest as RegionRequestBody | null | undefined;
  let regionRequestMeta = '';
  if (regionRequest && typeof regionRequest === 'object') {
    const region = typeof regionRequest.region === 'string' ? regionRequest.region.trim() : '';
    if (region) regionRequestMeta = region;
  }

  const referralCode = typeof body.referralCode === 'string' ? body.referralCode.trim() : '';

  // Env var intentionally named STRIPE_BASIC_PRICE_ID — UI labels the tier "Free" but the Stripe price config retains the original name to avoid a coordinated secrets rotation.
  const proPriceId = process.env.STRIPE_PRO_PRICE_ID;
  const basicPriceId = process.env.STRIPE_BASIC_PRICE_ID;
  if (!proPriceId || !basicPriceId) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }
  const priceId = plan === 'pro' ? proPriceId : basicPriceId;

  const stripe = getStripe();
  const admin = createSupabaseAdminClient();

  // Prefer the stripe_customer_id stored in the DB over an email-based lookup,
  // since Stripe allows multiple customers with the same email.
  const { data: dbRow } = await admin
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('contact', user.email)
    .maybeSingle();

  let customer: { id: string } | undefined;
  if (dbRow?.stripe_customer_id) {
    customer = { id: dbRow.stripe_customer_id };
  } else {
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    customer = customers.data[0];
  }

  if (customer) {
    const activeSubs = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1,
    });
    if (activeSubs.data.length > 0) {
      return NextResponse.json({ error: 'You already have an active subscription. Manage it from your dashboard.' }, { status: 409 });
    }
  }

  let stripeCustomerId = customer?.id;

  if (!stripeCustomerId) {
    const newCustomer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    stripeCustomerId = newCustomer.id;
  }

  const metadata: Record<string, string> = {
    contact: user.email,
    plan,
    region: rawRegion,
    topics: rawTopics.join('|'),
  };
  if (regionRequestMeta) metadata.region_request = regionRequestMeta;
  if (referralCode) metadata.referral_code = referralCode;

  // Free tier: create the subscription directly — no hosted checkout page needed
  // since no payment is required. Write to DB immediately and return success.
  if (plan === 'free') {
    const stripeSub = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: priceId, quantity: 1 }],
      metadata,
    });

    const periodEnd = stripeSub.items.data[0]?.current_period_end;
    const upsertPayload: Record<string, string> = {
      contact: user.email,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSub.id,
      stripe_status: stripeSub.status,
      ...(periodEnd && { stripe_period_end: new Date(periodEnd * 1000).toISOString() }),
      tier: 'free',
      region: rawRegion,
    };

    const { error: upsertError } = await admin
      .from('subscriptions')
      .upsert(upsertPayload, { onConflict: 'contact' });

    if (upsertError) {
      console.error('checkout: DB upsert failed:', upsertError);
      return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
    }

    // Save topics (max 1 for free tier).
    const truncatedTopics = rawTopics.slice(0, 1).map((t) => t.toLowerCase());
    if (truncatedTopics.length > 0) {
      const { data: topicRows } = await admin
        .from('supported_topics')
        .select('topic_id, topic_name')
        .in('topic_name', truncatedTopics);

      await admin
        .from('subscription_topics')
        .delete()
        .eq('subscription_id', user.email);

      if (topicRows && topicRows.length > 0) {
        await admin
          .from('subscription_topics')
          .insert(topicRows.map((row) => ({ subscription_id: user.email, topic_id: row.topic_id })));
      }
    }

    // Notify admin if the user requested an unsupported region.
    if (regionRequestMeta) {
      await submitRegionWaitlist({
        region: regionRequestMeta,
        voterEmail: user.email,
        referralCode: referralCode || undefined,
      });
    }

    return NextResponse.json({ success: true });
  }

  // Pro tier: use Stripe-hosted checkout so payment details are collected securely.
  const origin = request.headers.get('origin') ?? 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: stripeCustomerId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${origin}/local?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/local/onboarding?checkout=cancel`,
    metadata,
    subscription_data: {
      metadata,
    },
  });

  return NextResponse.json({ url: session.url });
}
