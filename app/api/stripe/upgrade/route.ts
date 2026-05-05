import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stripe = getStripe();
  const proPriceId = process.env.STRIPE_PRO_PRICE_ID!;

  const customers = await stripe.customers.list({ email: user.email, limit: 1 });
  const customer = customers.data[0];

  if (!customer) {
    // No Stripe customer yet — client should open the payment modal directly
    // via /api/stripe/subscribe-pro which will create the customer.
    return NextResponse.json({ requiresPayment: true });
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: customer.id,
    status: 'active',
    limit: 1,
  });

  const stripeSub = subscriptions.data[0];

  if (!stripeSub) {
    // No active subscription — client opens payment modal.
    return NextResponse.json({ requiresPayment: true });
  }

  const alreadyPro = stripeSub.items.data.some((item) => item.price?.id === proPriceId);
  if (alreadyPro) {
    return NextResponse.json({ error: 'Already on Pro' }, { status: 409 });
  }

  try {
    // Check if the customer has a payment method on file.
    const customerDetails = await stripe.customers.retrieve(customer.id) as {
      invoice_settings?: { default_payment_method?: string | null };
      default_source?: string | null;
    };
    const hasPaymentMethod = !!(
      customerDetails.invoice_settings?.default_payment_method ||
      customerDetails.default_source
    );

    if (hasPaymentMethod) {
      // Swap the price directly — no card needed.
      const currentItem = stripeSub.items.data[0];
      await stripe.subscriptions.update(stripeSub.id, {
        items: [{ id: currentItem.id, price: proPriceId }],
        metadata: { contact: user.email, plan: 'pro' },
        proration_behavior: 'create_prorations',
      });
      return NextResponse.json({ success: true });
    }

    // No payment method — client opens the payment modal.
    // /api/stripe/subscribe-pro will attach the PM and swap the price in one step.
    return NextResponse.json({ requiresPayment: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to upgrade';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
