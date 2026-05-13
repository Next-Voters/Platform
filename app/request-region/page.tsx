"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MapPin } from "lucide-react";
import { submitRegionWaitlist } from "@/server-actions/request-region";
import { trackReferralClick } from "@/server-actions/referrals";

function RequestRegionForm() {
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref");

  const [city, setCity] = useState("");
  const [email, setEmail] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const referralTrackedRef = useRef(false);

  useEffect(() => {
    if (refCode && !referralTrackedRef.current) {
      referralTrackedRef.current = true;
      trackReferralClick(refCode).catch(() => {});
    }
  }, [refCode]);

  const onDone = async () => {
    setError(null);
    const trimmedCity = city.trim();
    const trimmedEmail = email.trim();
    if (!trimmedCity) {
      setError("Please enter a city.");
      return;
    }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitRegionWaitlist({
        region: trimmedCity,
        voterEmail: trimmedEmail,
        referralCode: refCode || undefined,
      });
      if (result.ok === false) {
        setError(result.error);
        return;
      }
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="flex min-h-[calc(100dvh-56px)] flex-col items-center justify-center bg-page px-6 pb-16 pt-12">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-5">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-center text-[18px] font-bold text-gray-950">
          Thanks — we&apos;ll notify you when it&apos;s ready.
        </p>
        <a href="/" className="mt-7 text-[14.5px] font-semibold text-brand hover:underline">
          Back to Next Voters
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100dvh-56px)] flex-col bg-page">
      <div className="flex flex-1 flex-col items-center px-5 pt-12 sm:pt-16">
        <h1 className="text-center text-[24px] sm:text-[28px] font-bold text-gray-950 tracking-tight">
          Request your city.
        </h1>
        <p className="mt-2 text-center text-[15px] text-gray-500">
          We&apos;ll email you when it&apos;s ready.
        </p>

        <div className="mt-10 w-full max-w-md flex-1 space-y-5">
          <div>
            <label htmlFor="request-city" className="mb-1.5 block text-[13px] font-semibold text-gray-700">
              City
            </label>
            <div className="flex items-stretch border border-gray-200 rounded-xl overflow-hidden bg-white focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
              <div className="flex items-center justify-center px-3 border-r border-gray-200 bg-gray-50">
                <MapPin className="h-4 w-4 text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="request-city"
                type="text"
                autoComplete="off"
                placeholder="E.g. Portland"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setError(null);
                }}
                className="flex-1 min-w-0 px-3 py-3 text-[14.5px] text-gray-950 placeholder:text-gray-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="request-email" className="mb-1.5 block text-[13px] font-semibold text-gray-700">
              Your email
            </label>
            <input
              id="request-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[14.5px] text-gray-950 placeholder:text-gray-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>

          {error ? (
            <p className="text-[13px] font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 justify-center px-5 pb-10 pt-6">
        <button
          type="button"
          disabled={submitting}
          onClick={onDone}
          className="min-h-[50px] min-w-[180px] rounded-xl bg-brand px-10 text-[15px] font-bold text-white shadow-sm transition-colors hover:bg-brand-hover disabled:opacity-50"
        >
          {submitting ? "Sending…" : "Done"}
        </button>
      </div>
    </div>
  );
}

export default function RequestRegionPage() {
  return (
    <Suspense>
      <RequestRegionForm />
    </Suspense>
  );
}
