import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { submitRegionWaitlist } from '@/server-actions/request-region';

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const proPriceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!proPriceId) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const body = await request.json().catch(() => ({}));
  const paymentMethodId = typeof body.paymentMethodId === 'string' ? body.paymentMethodId.trim() : '';

  if (!paymentMethodId) {
    return NextResponse.json({ error: 'Payment method required.' }, { status: 400 });
  }

  // Onboarding data — present for new Pro signups, absent for upgrades (already saved in DB).
  const rawRegion = typeof body.region === 'string' ? body.region.trim() : '';
  const rawRegions: string[] = Array.isArray(body.regions)
    ? body.regions.filter((r: unknown): r is string => typeof r === 'string' && r.trim().length > 0).map((r: string) => r.trim())
    : [];
  const rawTopics: string[] = Array.isArray(body.topics)
    ? body.topics.filter((t: unknown): t is string => typeof t === 'string' && t.trim().length > 0).map((t: string) => t.trim())
    : [];

  const regionRequest = body.regionRequest as { region?: unknown } | null | undefined;
  let regionRequestMeta = '';
  if (regionRequest && typeof regionRequest === 'object') {
    const r = typeof regionRequest.region === 'string' ? regionRequest.region.trim() : '';
    if (r) regionRequestMeta = r;
  }

  const referralCode = typeof body.referralCode === 'string' ? body.referralCode.trim() : '';

  const stripe = getStripe();
  const admin = createSupabaseAdminClient();

  try {
    // Prefer the stripe_customer_id stored in the DB over an email-based lookup.
    const { data: dbRow } = await admin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('contact', user.email)
      .maybeSingle();

    let stripeCustomerId = dbRow?.stripe_customer_id;
    if (!stripeCustomerId) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      stripeCustomerId = customers.data[0]?.id;
    }

    if (!stripeCustomerId) {
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      stripeCustomerId = newCustomer.id;
    }

    // Attach the payment method and set it as the customer default.
    await stripe.paymentMethods.attach(paymentMethodId, { customer: stripeCustomerId });
    await stripe.customers.update(stripeCustomerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    // Check for an existing active subscription — if found, swap the price in-place.
    const existingSubs = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
      limit: 1,
    });

    if (existingSubs.data.length > 0) {
      const stripeSub = existingSubs.data[0];
      const alreadyPro = stripeSub.items.data.some((item) => item.price?.id === proPriceId);
      if (alreadyPro) {
        return NextResponse.json({ error: 'Already on Pro.' }, { status: 409 });
      }

      const currentItem = stripeSub.items.data[0];
      const updatedSub = await stripe.subscriptions.update(stripeSub.id, {
        items: [{ id: currentItem.id, price: proPriceId }],
        default_payment_method: paymentMethodId,
        proration_behavior: 'create_prorations',
        metadata: { contact: user.email, plan: 'pro' },
      });

      // Write tier and period end immediately so refetch() sees the updated state.
      const periodEnd = updatedSub.items.data[0]?.current_period_end;
      const updatePayload: Record<string, string> = { tier: 'pro' };
      if (periodEnd) {
        updatePayload.stripe_period_end = new Date(periodEnd * 1000).toISOString();
      }
      await admin.from('subscriptions').update(updatePayload).eq('contact', user.email);
      return NextResponse.json({ success: true });
    }

    // No existing subscription — create a fresh Pro subscription.
    const isNewSignup = rawRegion && rawTopics.length > 0;

    const metadata: Record<string, string> = {
      contact: user.email,
      plan: 'pro',
      ...(rawRegion && { region: rawRegion }),
      ...(rawRegions.length > 0 && { regions: rawRegions.join('|') }),
      ...(rawTopics.length > 0 && { topics: rawTopics.join('|') }),
    };
    if (regionRequestMeta) metadata.region_request = regionRequestMeta;
    if (referralCode) metadata.referral_code = referralCode;

    const stripeSub = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: proPriceId, quantity: 1 }],
      default_payment_method: paymentMethodId,
      metadata,
    });

    if (stripeSub.status !== 'active') {
      // Clean up the incomplete subscription so it doesn't orphan in Stripe.
      await stripe.subscriptions.cancel(stripeSub.id);
      return NextResponse.json(
        { error: 'Payment could not be processed. Please try a different payment method.' },
        { status: 402 }
      );
    }

    const periodEnd = stripeSub.items.data[0]?.current_period_end;
    const upsertPayload: Record<string, string> = {
      contact: user.email,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSub.id,
      stripe_status: stripeSub.status,
      tier: 'pro',
      ...(rawRegion && { region: rawRegion }),
    };
    if (periodEnd) {
      upsertPayload.stripe_period_end = new Date(periodEnd * 1000).toISOString();
    }

    const { error: upsertError } = await admin
      .from('subscriptions')
      .upsert(upsertPayload, { onConflict: 'contact' });

    if (upsertError) {
      console.error('subscribe-pro: DB upsert failed:', upsertError);
      return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
    }

    if (isNewSignup) {
      // Save topics (max 3 for Pro).
      const truncatedTopics = rawTopics.slice(0, 3).map((t) => t.toLowerCase());
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

      // Save selected regions (multi-level).
      if (rawRegions.length > 0) {
        await admin
          .from('subscription_regions')
          .delete()
          .eq('subscription_id', user.email);

        await admin
          .from('subscription_regions')
          .insert(rawRegions.map((r) => ({ subscription_id: user.email, region: r })));
      }

      // Notify admin if the user requested an unsupported region.
      if (regionRequestMeta) {
        await submitRegionWaitlist({
          region: regionRequestMeta,
          voterEmail: user.email,
          referralCode: referralCode || undefined,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create subscription';
    console.error('subscribe-pro error:', message);
    return NextResponse.json({ error: 'Failed to process subscription' }, { status: 500 });
  }
}
