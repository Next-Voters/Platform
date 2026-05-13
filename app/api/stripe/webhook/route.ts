import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import Stripe from 'stripe';

/**
 * Resolve the contact email for a Stripe event. Prefers subscription/session
 * metadata, falls back to DB lookup by stripe_customer_id or
 * stripe_subscription_id so events are never silently dropped when metadata
 * is missing.
 */
async function resolveContact(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  metadata: Stripe.Metadata | null | undefined,
  stripeCustomerId?: string,
  stripeSubscriptionId?: string,
): Promise<string | null> {
  if (metadata?.contact) return metadata.contact;

  if (stripeCustomerId) {
    const { data } = await supabase
      .from('subscriptions')
      .select('contact')
      .eq('stripe_customer_id', stripeCustomerId)
      .maybeSingle();
    if (data?.contact) return data.contact;
  }

  if (stripeSubscriptionId) {
    const { data } = await supabase
      .from('subscriptions')
      .select('contact')
      .eq('stripe_subscription_id', stripeSubscriptionId)
      .maybeSingle();
    if (data?.contact) return data.contact;
  }

  return null;
}

/** Safely extract the period-end timestamp from a subscription's first item. */
function getPeriodEnd(sub: Stripe.Subscription): string | null {
  const ts = sub.items.data[0]?.current_period_end;
  if (!ts) return null;
  return new Date(ts * 1000).toISOString();
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  const proPriceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!proPriceId) {
    return NextResponse.json({ error: 'STRIPE_PRO_PRICE_ID is not configured' }, { status: 500 });
  }

  const supabase = createSupabaseAdminClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== 'subscription') break;

      const contact = await resolveContact(
        supabase,
        session.metadata,
        session.customer as string,
        session.subscription as string,
      );
      if (!contact) {
        console.error(`Webhook ${event.type}: no contact resolvable for session ${session.id}`);
        break;
      }

      // Determine tier from actual subscription price IDs, not metadata.
      let tier: 'pro' | 'free' = 'free';
      let periodEnd: string | null = null;
      try {
        const stripeSub = await getStripe().subscriptions.retrieve(session.subscription as string);
        tier = stripeSub.items.data.some((i) => i.price.id === proPriceId) ? 'pro' : 'free';
        periodEnd = getPeriodEnd(stripeSub);
      } catch {
        // Fall back to metadata if subscription retrieval fails.
        tier = session.metadata?.plan === 'pro' ? 'pro' : 'free';
      }

      const checkoutRegion = typeof session.metadata?.region === 'string' ? session.metadata.region.trim() : '';
      const checkoutPayload: Record<string, string> = {
        contact,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        stripe_status: 'active',
        tier,
      };
      if (checkoutRegion) checkoutPayload.region = checkoutRegion;
      if (periodEnd) checkoutPayload.stripe_period_end = periodEnd;

      const { error: checkoutError } = await supabase
        .from('subscriptions')
        .upsert(checkoutPayload, { onConflict: 'contact' });
      if (checkoutError) {
        console.error(`Webhook ${event.type}:`, checkoutError);
        return NextResponse.json({ error: 'Database write failed' }, { status: 500 });
      }
      break;
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const contact = await resolveContact(
        supabase,
        sub.metadata,
        typeof sub.customer === 'string' ? sub.customer : undefined,
        sub.id,
      );
      if (!contact) {
        console.error(`Webhook ${event.type}: no contact resolvable for subscription ${sub.id}`);
        break;
      }

      const subTier = sub.items.data.some((i) => i.price.id === proPriceId) ? 'pro' : 'free';
      const periodEnd = getPeriodEnd(sub);

      const updatePayload: Record<string, string> = {
        stripe_status: sub.status,
        tier: subTier,
      };
      if (periodEnd) updatePayload.stripe_period_end = periodEnd;

      const { error: updateError } = await supabase
        .from('subscriptions')
        .update(updatePayload)
        .eq('contact', contact);
      if (updateError) {
        console.error(`Webhook ${event.type}:`, updateError);
        return NextResponse.json({ error: 'Database write failed' }, { status: 500 });
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const contact = await resolveContact(
        supabase,
        sub.metadata,
        typeof sub.customer === 'string' ? sub.customer : undefined,
        sub.id,
      );
      if (!contact) {
        console.error(`Webhook ${event.type}: no contact resolvable for subscription ${sub.id}`);
        break;
      }

      const { error: deleteError } = await supabase
        .from('subscriptions')
        .update({ stripe_status: 'canceled', tier: 'free' })
        .eq('contact', contact);
      if (deleteError) {
        console.error(`Webhook ${event.type}:`, deleteError);
        return NextResponse.json({ error: 'Database write failed' }, { status: 500 });
      }
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      const rawSub = invoice.parent?.subscription_details?.subscription;
      const subId = typeof rawSub === 'string' ? rawSub : rawSub?.id;
      if (!subId) break;

      const stripeSub = await getStripe().subscriptions.retrieve(subId);
      const contact = await resolveContact(
        supabase,
        stripeSub.metadata,
        typeof stripeSub.customer === 'string' ? stripeSub.customer : undefined,
        subId,
      );
      if (!contact) {
        console.error(`Webhook ${event.type}: no contact resolvable for subscription ${subId}`);
        break;
      }

      const paidTier = stripeSub.items.data.some((i) => i.price.id === proPriceId) ? 'pro' : 'free';
      const periodEnd = getPeriodEnd(stripeSub);

      const paidPayload: Record<string, string> = {
        stripe_status: 'active',
        tier: paidTier,
      };
      if (periodEnd) paidPayload.stripe_period_end = periodEnd;

      const { error: paidError } = await supabase
        .from('subscriptions')
        .update(paidPayload)
        .eq('contact', contact);
      if (paidError) {
        console.error(`Webhook ${event.type}:`, paidError);
        return NextResponse.json({ error: 'Database write failed' }, { status: 500 });
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const rawSub = invoice.parent?.subscription_details?.subscription;
      const subId = typeof rawSub === 'string' ? rawSub : rawSub?.id;
      if (!subId) break;

      const stripeSub = await getStripe().subscriptions.retrieve(subId);
      const contact = await resolveContact(
        supabase,
        stripeSub.metadata,
        typeof stripeSub.customer === 'string' ? stripeSub.customer : undefined,
        subId,
      );
      if (!contact) {
        console.error(`Webhook ${event.type}: no contact resolvable for subscription ${subId}`);
        break;
      }

      const { error: failedError } = await supabase
        .from('subscriptions')
        .update({ stripe_status: 'past_due' })
        .eq('contact', contact);
      if (failedError) {
        console.error(`Webhook ${event.type}:`, failedError);
        return NextResponse.json({ error: 'Database write failed' }, { status: 500 });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
