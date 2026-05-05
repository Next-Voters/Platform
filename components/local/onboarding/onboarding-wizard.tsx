"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  clearPendingAction,
  readPendingAction,
  writePendingAction,
} from "@/lib/pending-action";
import { getSupportedCities } from "@/server-actions/get-supported-cities";
import { submitRegionWaitlist } from "@/server-actions/request-region";
import { syncSubscriptionFromStripe } from "@/server-actions/sync-subscription";
import { CityStep } from "./city-step";
import { LanguageStep } from "./language-step";
import { TopicsStep } from "./topics-step";
import { PlanStep } from "./plan-step";
import { RequestStep } from "./request-step";
import { AlternativeCitiesStep } from "./alternative-cities-step";
import { OnboardingMode, OnboardingStep } from "./types";
import { useOnboardingState } from "./use-onboarding-state";
import { PaymentModal } from "@/components/local/payment-modal";

const SUBSCRIBE_LABELS: Record<OnboardingStep, string> = {
  1: "City",
  2: "Language",
  3: "Topics",
  4: "Plan",
};

const REQUEST_LABELS: Record<1 | 2 | 3, string> = {
  1: "City",
  2: "Request",
  3: "Other cities?",
};

export function OnboardingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlRef = searchParams.get("ref");
  const urlCity = searchParams.get("city");
  const { user } = useAuth();
  const errorParam = searchParams.get("error");

  const {
    state,
    step,
    mode,
    referralCode,
    updateState,
    setStep,
    setMode,
    setPendingPlan,
    setReferralCode,
  } = useOnboardingState();

  const [supportedCities, setSupportedCities] = useState<string[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(true);
  const [checkoutError, setCheckoutError] = useState<string | null>(
    errorParam === "oauth_failed"
      ? "We couldn't sign you in with Google. Try again, or email hello@nextvoters.com."
      : null,
  );
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [preAuthNotice, setPreAuthNotice] = useState<string | null>(null);
  const [autoKickoffLabel, setAutoKickoffLabel] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const isFirstStepChangeRef = useRef(true);
  const hydratedFromCityParamRef = useRef(false);
  const requestCookieHandledRef = useRef(false);

  useEffect(() => {
    getSupportedCities()
      .then(setSupportedCities)
      .finally(() => setCitiesLoading(false));
  }, []);

  useEffect(() => {
    if (isFirstStepChangeRef.current) {
      isFirstStepChangeRef.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step, mode]);

  useEffect(() => {
    if (urlRef && urlRef !== referralCode) {
      setReferralCode(urlRef);
    }
  }, [urlRef, referralCode, setReferralCode]);

  // Pre-fill city from `?city=` (e.g., from the landing-page hero or the
  // /local → onboarding "Back to plan selection" path). Also accepts
  // `?language=` and `?topics=` (comma-sep) so a user returning from a failed
  // kickoff or from a Supabase cookie-delay redirect lands back on their
  // furthest-completed step instead of step 1. Runs once after cities load so
  // the supported-match check is valid. URL is stripped after hydration so a
  // remount (auth flip, back-nav) can't re-fire this effect.
  useEffect(() => {
    if (citiesLoading || hydratedFromCityParamRef.current) return;
    if (!urlCity) return;
    const trimmed = urlCity.trim();
    if (!trimmed) return;
    hydratedFromCityParamRef.current = true;

    const urlLanguage = searchParams.get("language")?.trim() ?? "";
    const urlTopicsRaw = searchParams.get("topics");
    const urlTopics = urlTopicsRaw
      ? urlTopicsRaw.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const match = supportedCities.find(
      (c) => c.toLowerCase() === trimmed.toLowerCase(),
    );
    if (match) {
      updateState({
        city: match,
        cityRequest: null,
        language: urlLanguage,
        topics: urlTopics,
      });
      setMode("subscribe");
      // Jump to the furthest step the hydrated state unlocks.
      if (urlLanguage && urlTopics.length > 0) setStep(4);
      else if (urlLanguage) setStep(3);
      else setStep(2);
    } else {
      updateState({
        city: "",
        cityRequest: { city: trimmed },
        language: urlLanguage,
        topics: urlTopics,
      });
      setMode("request");
      setStep(2);
    }

    router.replace("/local/onboarding", { scroll: false });
  }, [
    citiesLoading,
    supportedCities,
    urlCity,
    searchParams,
    updateState,
    setMode,
    setStep,
    router,
  ]);

  // Request-flow OAuth return: cookie carries the requested city. We land on
  // /local/onboarding post-auth; read the cookie, auto-submit the waitlist,
  // and advance to the alternatives step. One-shot via ref.
  useEffect(() => {
    if (requestCookieHandledRef.current) return;
    if (!user?.email) return;
    const pending = readPendingAction();
    if (!pending || pending.type !== "request") return;
    if (!pending.city) {
      clearPendingAction();
      return;
    }
    requestCookieHandledRef.current = true;

    updateState({
      city: "",
      cityRequest: { city: pending.city },
    });
    setMode("request");
    setStep(2);
    setAutoKickoffLabel(`Adding ${pending.city} to your waitlist…`);

    (async () => {
      try {
        const result = await submitRegionWaitlist({
          city: pending.city,
          voterEmail: user.email!,
          referralCode: pending.referralCode || undefined,
        });
        clearPendingAction();
        if (result.ok === false) {
          setCheckoutError(result.error);
        } else {
          setStep(3);
        }
      } catch {
        clearPendingAction();
        setCheckoutError("We couldn't save your request. Please try again.");
      } finally {
        setAutoKickoffLabel(null);
      }
    })();
  }, [user, updateState, setMode, setStep]);

  const totalSteps = mode === "request" ? 3 : 4;
  const stepLabel =
    mode === "request"
      ? REQUEST_LABELS[step as 1 | 2 | 3] ?? "City"
      : SUBSCRIBE_LABELS[step];

  const goBack = useCallback(() => {
    if (step > 1) setStep((step - 1) as OnboardingStep);
  }, [step, setStep]);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    });
  };

  const handleCheckout = useCallback(
    async (plan: "free" | "pro") => {
      setCheckoutError(null);

      if (!user) {
        // Carry the full plan selection through the OAuth round-trip via a
        // SameSite=Lax cookie. Embedding state in `redirectTo` (e.g.
        // `?next=%2Flocal%3Fplan%3D...`) is fragile: Supabase strict-matches
        // redirect URLs and falls back to the Site URL on mismatch, stranding
        // the user on the home page. The redirectTo stays clean; /local reads
        // the cookie and fires the Stripe POST after auth settles.
        setPendingPlan(plan);
        setPreAuthNotice("Last step: save your plan! Login to a Next Voters account.");
        await new Promise((resolve) => setTimeout(resolve, 1200));
        // Write the cookie just before OAuth so a user who bails during the
        // 1.2s notice window doesn't leave a stale cookie behind.
        writePendingAction({
          type: "subscribe",
          plan,
          city: state.city,
          language: state.language,
          topics: state.topics,
          cityRequest: state.cityRequest,
          referralCode: referralCode || null,
        });
        const supabase = createSupabaseBrowserClient();
        const { error: oauthError } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/local")}`,
          },
        });
        if (oauthError) {
          clearPendingAction();
          setPreAuthNotice(null);
          setCheckoutError(oauthError.message);
          scrollToBottom();
        }
        return;
      }

      // Pro tier: open the in-app payment modal — no Stripe redirect needed.
      if (plan === "pro") {
        setShowPaymentModal(true);
        return;
      }

      setIsRedirecting(true);
      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan,
            city: state.city,
            language: state.language,
            topics: state.topics,
            cityRequest: state.cityRequest,
            referralCode: referralCode || undefined,
          }),
        });

        // Stripe already has an active subscription for this customer. Sync
        // the DB row from Stripe and send the user to their dashboard. If the
        // sync fails, surface the error here — redirecting to /local blind
        // would ping-pong the user back to this page.
        if (res.status === 409) {
          const syncResult = await syncSubscriptionFromStripe();
          if (!syncResult.ok) {
            setCheckoutError(
              syncResult.error ||
                "You already have an active subscription, but we couldn't sync it. Contact hello@nextvoters.com.",
            );
            setIsRedirecting(false);
            scrollToBottom();
            return;
          }
          router.replace("/local");
          return;
        }

        const data = await res.json();
        if (data.success) {
          router.replace("/local");
          return;
        }
        setCheckoutError(data.error ?? "Something went wrong. Please try again.");
        setIsRedirecting(false);
        scrollToBottom();
      } catch {
        setCheckoutError("Something went wrong. Please try again.");
        setIsRedirecting(false);
        scrollToBottom();
      }
    },
    [state, referralCode, user, setPendingPlan, router],
  );

  const handleCityContinue = useCallback(
    (cityWasSupported: boolean) => {
      const nextMode: OnboardingMode = cityWasSupported ? "subscribe" : "request";
      setMode(nextMode);
      setStep(2);
    },
    [setMode, setStep],
  );

  const handleSubscribeAdvance = useCallback(() => {
    if (step < 4) setStep((step + 1) as OnboardingStep);
  }, [step, setStep]);

  const handleRequestSubmitted = useCallback(() => {
    setStep(3);
  }, [setStep]);

  const handlePickAlternative = useCallback(
    (city: string) => {
      updateState({ city, cityRequest: null });
      setMode("subscribe");
      setStep(2);
    },
    [updateState, setMode, setStep],
  );

  return (
    <div className="w-full min-h-[calc(100vh-56px)] bg-page">
      <div className="max-w-[560px] mx-auto px-5 sm:px-6 pt-10 pb-16">
        {/* Stepper + back arrow */}
        <div className="flex items-center gap-3 mb-8">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 1}
            className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div
            className="flex-1 flex items-center gap-2"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={totalSteps}
            aria-valuenow={step}
            aria-valuetext={`Step ${step} of ${totalSteps}: ${stepLabel}`}
          >
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
              <div
                key={s}
                className={[
                  "flex-1 h-1 rounded-full transition-colors",
                  s <= step ? "bg-brand" : "bg-gray-200",
                ].join(" ")}
              />
            ))}
          </div>
          <span className="text-[12px] font-semibold text-gray-500 tabular-nums">
            {step} / {totalSteps}
          </span>
        </div>

        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-[28px] sm:text-[34px] font-bold text-gray-950 leading-tight tracking-tight mb-8 outline-none"
        >
          {stepLabel}
        </h1>

        {step === 1 && (
          <CityStep
            state={state}
            supportedCities={supportedCities}
            citiesLoading={citiesLoading}
            updateState={updateState}
            onContinue={handleCityContinue}
          />
        )}

        {mode === "subscribe" && step === 2 && (
          <LanguageStep
            state={state}
            updateState={updateState}
            onContinue={handleSubscribeAdvance}
          />
        )}
        {mode === "subscribe" && step === 3 && (
          <TopicsStep
            state={state}
            updateState={updateState}
            onContinue={handleSubscribeAdvance}
          />
        )}
        {mode === "subscribe" && step === 4 && (
          <PlanStep
            state={state}
            isRedirecting={isRedirecting}
            onCheckout={handleCheckout}
          />
        )}

        {mode === "request" && step === 2 && (
          <RequestStep
            state={state}
            referralCode={referralCode}
            onContinue={handleRequestSubmitted}
          />
        )}
        {mode === "request" && step === 3 && (
          <AlternativeCitiesStep
            state={state}
            supportedCities={supportedCities}
            onPick={handlePickAlternative}
          />
        )}

        {checkoutError && (
          <p
            className="mt-5 text-[13.5px] font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2"
            role="alert"
            aria-live="polite"
          >
            {checkoutError}
          </p>
        )}
      </div>

      <PaymentModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onSuccess={() => router.replace("/local")}
        city={state.city}
        language={state.language}
        topics={state.topics}
        cityRequest={state.cityRequest}
        referralCode={referralCode || null}
      />

      {(preAuthNotice || autoKickoffLabel) && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-5 animate-in fade-in duration-150"
          role="status"
          aria-live="polite"
        >
          <div className="w-full max-w-[380px] bg-white rounded-2xl shadow-xl p-6 text-center">
            {preAuthNotice ? (
              <>
                <p className="text-[17px] font-bold text-gray-950 tracking-tight mb-1.5">
                  Last step: save your plan!
                </p>
                <p className="text-[14px] text-gray-500 mb-5">
                  Login to a Next Voters account.
                </p>
                <div className="flex items-center justify-center gap-2 text-[13px] font-medium text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Redirecting to Google…
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" aria-hidden="true" />
                <p className="text-[14.5px] font-semibold text-gray-800">
                  {autoKickoffLabel}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
