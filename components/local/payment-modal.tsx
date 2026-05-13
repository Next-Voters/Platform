'use client';

import { useCallback, useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// ── Inner form (rendered inside Elements provider) ───────────────────────────

interface PaymentFormProps {
  onSuccess: () => void;
  onError: (msg: string) => void;
  region?: string;
  topics?: string[];
  regionRequest?: { region: string } | null;
  referralCode?: string | null;
}

function PaymentForm({
  onSuccess,
  onError,
  region,
  topics,
  regionRequest,
  referralCode,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!stripe || !elements) return;

      setSubmitting(true);
      try {
        // Confirm the SetupIntent client-side. `redirect: 'if_required'` avoids
        // a page redirect for card payments (which don't need one).
        const result = await stripe.confirmSetup({
          elements,
          confirmParams: {
            return_url: `${window.location.origin}/local`,
          },
          redirect: 'if_required',
        });

        if (result.error) {
          onError(result.error.message ?? 'Payment failed. Please try again.');
          return;
        }

        const paymentMethodId =
          typeof result.setupIntent?.payment_method === 'string'
            ? result.setupIntent.payment_method
            : (result.setupIntent?.payment_method as { id: string } | null)?.id;

        if (!paymentMethodId) {
          onError('Could not retrieve payment method. Please try again.');
          return;
        }

        const res = await fetch('/api/stripe/subscribe-pro', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentMethodId,
            region,
            topics,
            regionRequest,
            referralCode,
          }),
        });

        const data = await res.json();
        if (data.success) {
          onSuccess();
        } else {
          onError(data.error ?? 'Something went wrong. Please try again.');
        }
      } catch {
        onError('Something went wrong. Please try again.');
      } finally {
        setSubmitting(false);
      }
    },
    [stripe, elements, onSuccess, onError, region, topics, regionRequest, referralCode],
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <PaymentElement
        options={{
          layout: 'tabs',
        }}
      />
      <button
        type="submit"
        disabled={!stripe || !elements || submitting}
        className="inline-flex items-center justify-center min-h-[44px] px-6 text-[14.5px] font-bold text-white bg-brand rounded-xl hover:bg-brand-hover transition-colors disabled:opacity-50 shadow-sm"
      >
        {submitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
            Processing…
          </>
        ) : (
          'Subscribe — $2/mo'
        )}
      </button>
    </form>
  );
}

// ── Public modal component ────────────────────────────────────────────────────

export interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  region?: string;
  topics?: string[];
  regionRequest?: { region: string } | null;
  referralCode?: string | null;
}

export function PaymentModal({
  open,
  onClose,
  onSuccess,
  region,
  topics,
  regionRequest,
  referralCode,
}: PaymentModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Fetch a fresh SetupIntent each time the modal opens.
  useEffect(() => {
    if (!open) return;
    setClientSecret(null);
    setFetchError(null);
    setPaymentError(null);

    (async () => {
      try {
        const res = await fetch('/api/stripe/setup-intent', { method: 'POST' });
        const data = await res.json();
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setFetchError(data.error ?? 'Could not initialise payment. Please try again.');
        }
      } catch {
        setFetchError('Could not initialise payment. Please try again.');
      }
    })();
  }, [open]);

  const handleSuccess = useCallback(() => {
    onSuccess();
    onClose();
  }, [onSuccess, onClose]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-[440px] rounded-2xl px-6 py-8">
        <DialogHeader className="mb-5">
          <DialogTitle className="text-[20px] font-bold text-gray-950 tracking-tight">
            Upgrade to Pro
          </DialogTitle>
          <DialogDescription className="text-[13.5px] text-gray-500 mt-1">
            $2/month. Cancel anytime.
          </DialogDescription>
        </DialogHeader>

        {fetchError && (
          <p className="text-[13.5px] font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {fetchError}
          </p>
        )}

        {!fetchError && !clientSecret && (
          <div className="flex items-center justify-center py-10 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
          </div>
        )}

        {clientSecret && (
          <>
            {paymentError && (
              <p
                className="mb-4 text-[13.5px] font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
                role="alert"
              >
                {paymentError}
              </p>
            )}
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'stripe',
                  variables: {
                    borderRadius: '10px',
                    fontFamily: 'inherit',
                  },
                },
              }}
            >
              <PaymentForm
                onSuccess={handleSuccess}
                onError={setPaymentError}
                region={region}
                topics={topics}
                regionRequest={regionRequest}
                referralCode={referralCode}
              />
            </Elements>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
