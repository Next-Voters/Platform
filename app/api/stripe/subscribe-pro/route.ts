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

  const body = await request.json().catch(() => ({}));
  const paymentMethodId = typeof body.paymentMethodId === 'string' ? body.paymentMethodId.trim() : '';

  if (!paymentMethodId) {
    return NextResponse.json({ error: 'Payment method required.' }, { status: 400 });
  }

  // Onboarding data — present for new Pro signups, absent for upgrades (already saved in DB).
  const rawCity = typeof body.city === 'string' ? body.city.trim() : '';
  const rawLanguage = typeof body.language === 'string' ? body.language.trim() : '';
  const rawTopics: string[] = Array.isArray(body.topics)
    ? body.topics.filter((t: unknown): t is string => typeof t === 'string' && t.trim().length > 0).map((t: string) => t.trim())
    : [];

  const cityRequest = body.cityRequest as { city?: unknown } | null | undefined;
  let cityRequestMeta = '';
  if (cityRequest && typeof cityRequest === 'object') {
    const c = typeof cityRequest.city === 'string' ? cityRequest.city.trim() : '';
    if (c) cityRequestMeta = c;
  }

  const referralCode = typeof body.referralCode === 'string' ? body.referralCode.trim() : '';

  const stripe = getStripe();
  const proPriceId = process.env.STRIPE_PRO_PRICE_ID!;

  // Find or create Stripe customer.
  const customers = await stripe.customers.list({ email: user.email, limit: 1 });
  let stripeCustomerId = customers.data[0]?.id;

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

  const admin = createSupabaseAdminClient();

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
    await stripe.subscriptions.update(stripeSub.id, {
      items: [{ id: currentItem.id, price: proPriceId }],
      default_payment_method: paymentMethodId,
      proration_behavior: 'create_prorations',
      metadata: { contact: user.email, plan: 'pro' },
    });

    // Subscription ID unchanged — webhook will sync status. Nothing else to write.
    return NextResponse.json({ success: true });
  }

  // No existing subscription — create a fresh Pro subscription.
  const isNewSignup = rawCity && rawLanguage && rawTopics.length > 0;

  const metadata: Record<string, string> = {
    contact: user.email,
    plan: 'pro',
    ...(rawCity && { city: rawCity }),
    ...(rawLanguage && { language: rawLanguage }),
    ...(rawTopics.length > 0 && { topics: rawTopics.join('|') }),
  };
  if (cityRequestMeta) metadata.city_request = cityRequestMeta;
  if (referralCode) metadata.referral_code = referralCode;

  const stripeSub = await stripe.subscriptions.create({
    customer: stripeCustomerId,
    items: [{ price: proPriceId, quantity: 1 }],
    default_payment_method: paymentMethodId,
    metadata,
  });

  const upsertPayload: Record<string, string> = {
    contact: user.email,
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: stripeSub.id,
    stripe_status: 'active',
    ...(rawCity && { city: rawCity }),
    ...(rawLanguage && { preferred_language: rawLanguage }),
  };

  const { error: upsertError } = await admin
    .from('subscriptions')
    .upsert(upsertPayload, { onConflict: 'contact' });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
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

    // Notify admin if the user requested an unsupported city.
    if (cityRequestMeta) {
      await submitRegionWaitlist({
        city: cityRequestMeta,
        voterEmail: user.email,
        referralCode: referralCode || undefined,
      });
    }
  }

  return NextResponse.json({ success: true });
}
