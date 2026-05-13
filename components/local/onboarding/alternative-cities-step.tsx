"use client";

import { useState } from "react";
import { MapPin, CheckCircle2 } from "lucide-react";
import { OnboardingState } from "./types";

interface Props {
  state: OnboardingState;
  supportedRegions: string[];
  onPick: (region: string) => void;
}

export function AlternativeCitiesStep({ state, supportedRegions, onPick }: Props) {
  const [skipped, setSkipped] = useState(false);
  const requestedCity = state.regionRequest?.region ?? "your city";

  if (skipped) {
    return (
      <div className="py-6">
        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-5">
          <CheckCircle2 className="w-6 h-6 text-green-600" aria-hidden="true" />
        </div>
        <p className="text-[20px] font-bold text-gray-950 mb-2 tracking-tight">
          You&rsquo;re on the waitlist.
        </p>
        <p className="text-[14.5px] text-gray-500 leading-relaxed mb-6">
          We&rsquo;ll email you the moment{" "}
          <span className="font-semibold text-gray-900">{requestedCity}</span>{" "}
          launches.
        </p>
        <a
          href="/"
          className="inline-flex items-center justify-center min-h-[44px] px-6 text-[14.5px] font-semibold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
        >
          Back to Next Voters
        </a>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[15px] text-gray-500 leading-relaxed mb-6">
        Want updates for a city we already cover while you wait for{" "}
        <span className="font-semibold text-gray-900">{requestedCity}</span>?
      </p>

      <div className="space-y-2 mb-6">
        {supportedRegions.length === 0 ? (
          <p className="text-[13.5px] text-gray-400">No other cities available yet.</p>
        ) : (
          supportedRegions.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => onPick(city)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left text-[14.5px] font-semibold text-gray-800 bg-white border border-gray-200 rounded-xl hover:border-brand hover:bg-brand/5 transition-colors"
            >
              <MapPin className="w-4 h-4 text-gray-400 shrink-0" aria-hidden="true" />
              {city}
            </button>
          ))
        )}
      </div>

      <button
        type="button"
        onClick={() => setSkipped(true)}
        className="text-[13.5px] font-medium text-gray-500 hover:text-gray-900 transition-colors"
      >
        No thanks — just notify me when {requestedCity} launches.
      </button>
    </div>
  );
}
