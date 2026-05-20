"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { OnboardingState } from "./types";

interface Props {
  state: OnboardingState;
  isRedirecting: boolean;
  onCheckout: (plan: "free" | "pro") => void;
}

export function PlanStep({ state, isRedirecting, onCheckout }: Props) {
  const [pending, setPending] = useState<"free" | "pro" | null>(null);

  useEffect(() => {
    if (!isRedirecting) setPending(null);
  }, [isRedirecting]);

  const cityRequiresPro = state.selectedRegions.some((r) => r.type === "city");

  const handleClick = (plan: "free" | "pro") => {
    setPending(plan);
    onCheckout(plan);
  };

  return (
    <div>
      <p className="text-[15px] text-gray-500 leading-relaxed mb-6">
        Pick the plan that works for you. You can change it any time.
      </p>

      <a
        href="/pricing"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-brand hover:underline mb-6"
      >
        View pricing details
        <ExternalLink className="w-3.5 h-3.5" />
      </a>

      {cityRequiresPro && (
        <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
          <p className="text-[13px] text-gray-600 leading-relaxed">
            City-level updates require Pro. Go back to pick a state or country, or choose Pro.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => handleClick("free")}
          disabled={isRedirecting || cityRequiresPro}
          className="w-full min-h-[64px] px-6 py-4 text-[15.5px] font-bold text-gray-800 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {pending === "free" && isRedirecting ? "Redirecting…" : "Start free"}
        </button>

        <button
          type="button"
          onClick={() => handleClick("pro")}
          disabled={isRedirecting}
          className="w-full min-h-[64px] px-6 py-4 text-[15.5px] font-bold text-white bg-brand rounded-xl hover:bg-brand-hover transition-colors shadow-sm disabled:opacity-50"
        >
          {pending === "pro" && isRedirecting ? "Redirecting…" : "Upgrade to Pro"}
        </button>
      </div>
    </div>
  );
}
