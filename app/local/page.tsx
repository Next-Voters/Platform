'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useSubscription } from '@/hooks/use-subscription';
import { SubscriptionDashboard } from '@/components/local/subscription-dashboard';
import {
  clearPendingAction,
  readPendingAction,
  type PendingAction,
} from '@/lib/pending-action';
import { fulfillCheckout } from '@/server-actions/fulfill-checkout';
import { syncSubscriptionFromStripe } from '@/server-actions/sync-subscription';
import { PaymentModal } from '@/components/local/payment-modal';

interface ProModalData {
  region: string;
  regions: string[];
  topics: string[];
  regionRequest: { region: string } | null;
  referralCode: string | null;
}

function NVLocalInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { hasSubscription, isLoading: subLoading, refetch } = useSubscription();
  const [fulfilling, setFulfilling] = useState(false);
  const [kickingOff, setKickingOff] = useState(false);
  const [kickoffError, setKickoffError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [pendingChecked, setPendingChecked] = useState(false);
  const [proModalOpen, setProModalOpen] = useState(false);
  const [proModalData, setProModalData] = useState<ProModalData | null>(null);
  const fulfilledSessionRef = useRef<string | null>(null);
  const kickoffFiredRef = useRef(false);

  const isPostCheckout = searchParams.get('checkout') === 'success';
  const sessionId = searchParams.get('session_id');
  const conversionFiredRef = useRef(false);

  // Fire Google Ads conversion event after successful checkout.
  // Guarantee the dataLayer queue and gtag wrapper exist so the event is
  // never silently dropped — queued events are processed when gtag.js loads.
  useEffect(() => {
    if (!isPostCheckout || conversionFiredRef.current) return;
    conversionFiredRef.current = true;
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== 'function') {
      window.gtag = function (...args: unknown[]) {
        (window.dataLayer as unknown[]).push(args);
      };
    }
    window.gtag('event', 'conversion', {
      send_to: 'AW-18024404483/iVVXCP-BpZUcEIOs2pJD',
      value: 1.0,
      currency: 'USD',
    });
  }, [isPostCheckout]);

  // Read the pending-action cookie once on mount.
  useEffect(() => {
    setPending(readPendingAction());
    setPendingChecked(true);
  }, []);

  const hasSubscribeIntent = pending?.type === 'subscribe';

  // Post-Stripe fulfillment (Pro only — free tier no longer goes through checkout sessions).
  // Ref keyed on sessionId guards against StrictMode double-invocation.
  useEffect(() => {
    if (!isPostCheckout || !sessionId || !user) return;
    if (fulfilledSessionRef.current === sessionId) return;
    fulfilledSessionRef.current = sessionId;
    setFulfilling(true);
    (async () => {
      try {
        const result = await fulfillCheckout(sessionId);
        if (result.success) await refetch();
      } finally {
        setFulfilling(false);
      }
    })();
  }, [isPostCheckout, sessionId, user, refetch]);

  // Subscribe kickoff: cookie carries the pending selection after OAuth.
  useEffect(() => {
    if (!pendingChecked) return;
    if (authLoading || subLoading || fulfilling) return;
    if (!user || hasSubscription) return;
    if (!hasSubscribeIntent) return;
    if (kickoffFiredRef.current) return;
    kickoffFiredRef.current = true;
    setKickingOff(true);

    const sub = pending as Extract<PendingAction, { type: 'subscribe' }>;

    // Pro tier after OAuth: open the in-app payment modal instead of calling the checkout API.
    if (sub.plan === 'pro') {
      setProModalData({
        region: sub.region,
        regions: sub.regions ?? [],
        topics: sub.topics,
        regionRequest: sub.regionRequest,
        referralCode: sub.referralCode,
      });
      setProModalOpen(true);
      clearPendingAction();
      setKickingOff(false);
      return;
    }

    (async () => {
      try {
        const res = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan: sub.plan,
            region: sub.region,
            regions: sub.regions ?? [],
            topics: sub.topics,
            regionRequest: sub.regionRequest,
            referralCode: sub.referralCode || undefined,
          }),
        });

        if (res.status === 409) {
          clearPendingAction();
          const syncResult = await syncSubscriptionFromStripe();
          if (!syncResult.ok) {
            setKickoffError(
              syncResult.error ||
                "You already have an active subscription, but we couldn't sync it. Contact hello@nextvoters.com.",
            );
            setKickingOff(false);
            return;
          }
          await refetch();
          setKickingOff(false);
          return;
        }

        const data = await res.json();
        if (data.success) {
          clearPendingAction();
          await refetch();
          setKickingOff(false);
          return;
        }
        clearPendingAction();
        setKickoffError(data.error ?? 'Something went wrong. Please try again.');
        setKickingOff(false);
      } catch {
        clearPendingAction();
        setKickoffError("We couldn't reach checkout. Please try again.");
        setKickingOff(false);
      }
    })();
  }, [
    pendingChecked,
    authLoading,
    subLoading,
    fulfilling,
    user,
    hasSubscription,
    hasSubscribeIntent,
    pending,
    refetch,
  ]);

  // Redirect for anyone without a subscription. Exception: stay put while a
  // subscribe kickoff is about to fire or in flight, or while the Pro payment
  // modal is open. When user=null, always bounce through onboarding.
  useEffect(() => {
    if (!pendingChecked) return;
    if (authLoading || subLoading || fulfilling || kickingOff) return;
    if (!user) {
      router.replace('/local/onboarding');
      return;
    }
    if (hasSubscription) return;
    if (hasSubscribeIntent || proModalOpen) return;
    router.replace('/local/onboarding');
  }, [
    pendingChecked,
    authLoading,
    subLoading,
    fulfilling,
    kickingOff,
    user,
    hasSubscription,
    hasSubscribeIntent,
    proModalOpen,
    router,
  ]);

  const handleProModalSuccess = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleProModalClose = useCallback(() => {
    setProModalOpen(false);
    // If the user closed without completing payment, send them back to pick a plan.
    if (!hasSubscription) {
      router.replace('/local/onboarding');
    }
  }, [hasSubscription, router]);

  // The PaymentModal is always in the tree so it can open from any render state.
  const proModal = (
    <PaymentModal
      open={proModalOpen}
      onClose={handleProModalClose}
      onSuccess={handleProModalSuccess}
      region={proModalData?.region}
      regions={proModalData?.regions}
      topics={proModalData?.topics}
      regionRequest={proModalData?.regionRequest}
      referralCode={proModalData?.referralCode}
    />
  );

  if (authLoading || subLoading || fulfilling || kickingOff || !pendingChecked) {
    const label = fulfilling
      ? 'Setting up your subscription…'
      : kickingOff
        ? 'Finishing your setup…'
        : 'Loading…';
    return (
      <>
        <div className="w-full min-h-[calc(100vh-56px)] bg-page flex items-center justify-center px-5">
          <div className="flex items-center gap-3 text-gray-500 text-[14px]">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            {label}
          </div>
        </div>
        {proModal}
      </>
    );
  }

  if (kickoffError) {
    return (
      <>
        <div className="w-full min-h-[calc(100vh-56px)] bg-page flex items-center justify-center px-5 py-12">
          <div className="w-full max-w-[400px] bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
            <h1 className="text-[20px] font-bold text-gray-950 mb-2 tracking-tight">
              Checkout didn&apos;t start.
            </h1>
            <p
              className="text-[14px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-6"
              role="alert"
              aria-live="polite"
            >
              {kickoffError}
            </p>
            <button
              type="button"
              onClick={() => router.replace('/local/onboarding')}
              className="inline-flex items-center justify-center min-h-[44px] px-6 text-[14.5px] font-semibold text-white bg-brand rounded-xl hover:bg-brand-hover transition-colors shadow-sm"
            >
              Back to plan selection
            </button>
          </div>
        </div>
        {proModal}
      </>
    );
  }

  if (!user || !hasSubscription) return proModal;

  return (
    <>
      <SubscriptionDashboard />
      {proModal}
    </>
  );
}

export default function NVLocalPage() {
  return (
    <Suspense fallback={<div className="w-full min-h-[calc(100vh-56px)] bg-page flex items-center justify-center"><p className="text-gray-400 text-[14px]">Loading…</p></div>}>
      <NVLocalInner />
    </Suspense>
  );
}
