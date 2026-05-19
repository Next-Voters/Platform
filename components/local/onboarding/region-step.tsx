"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { type SupportedRegion } from "@/server-actions/get-supported-regions";
import { OnboardingState } from "./types";

interface Props {
  state: OnboardingState;
  supportedRegions: SupportedRegion[];
  regionsLoading: boolean;
  updateState: (patch: Partial<OnboardingState>) => void;
  onContinue: (regionWasSupported: boolean) => void;
}

interface PhotonSuggestion {
  label: string;
  name: string;
  state: string | null;
  country: string | null;
}

export function RegionStep({
  state,
  supportedRegions,
  regionsLoading,
  updateState,
  onContinue,
}: Props) {
  const [input, setInput] = useState(
    state.region || state.regionRequest?.region || "",
  );
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<PhotonSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [pickedSuggestion, setPickedSuggestion] = useState<PhotonSuggestion | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trimmed = input.trim();
    if (trimmed.length < 2 || trimmed === pickedSuggestion?.name) {
      setSuggestions([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const res = await fetch(
          `/api/regions/search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );
        if (!res.ok) {
          setSuggestions([]);
          return;
        }
        const data = (await res.json()) as { regions?: PhotonSuggestion[] };
        setSuggestions(data.regions ?? []);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setSuggestions([]);
      } finally {
        setSuggestionsLoading(false);
      }
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [input, pickedSuggestion?.name]);

  const hasDropdown =
    suggestionsOpen && (suggestions.length > 0 || suggestionsLoading);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setSuggestionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePick = (s: PhotonSuggestion) => {
    setInput(s.name);
    setPickedSuggestion(s);
    setSuggestions([]);
    setSuggestionsOpen(false);
    setError(null);
  };

  const handleContinue = () => {
    setError(null);
    const trimmed = input.trim();
    if (!trimmed) {
      setError("Please enter your city.");
      return;
    }

    const ci = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

    const cityMatch = supportedRegions.find(
      (r) => r.type === "city" && ci(r.region, trimmed),
    );
    if (cityMatch) {
      updateState({ region: cityMatch.region, regionRequest: null });
      onContinue(true);
      return;
    }

    if (pickedSuggestion) {
      if (pickedSuggestion.state) {
        const stateMatch = supportedRegions.find(
          (r) => r.type === "state" && ci(r.region, pickedSuggestion.state!),
        );
        if (stateMatch) {
          updateState({ region: stateMatch.region, regionRequest: null });
          onContinue(true);
          return;
        }
      }

      if (pickedSuggestion.country) {
        const countryMatch = supportedRegions.find(
          (r) => r.type === "country" && ci(r.region, pickedSuggestion.country!),
        );
        if (countryMatch) {
          updateState({ region: countryMatch.region, regionRequest: null });
          onContinue(true);
          return;
        }
      }
    }

    const flatMatch = supportedRegions.find((r) => ci(r.region, trimmed));
    if (flatMatch) {
      updateState({ region: flatMatch.region, regionRequest: null });
      onContinue(true);
      return;
    }

    const requestRegion = pickedSuggestion?.state ?? trimmed;
    updateState({ region: "", regionRequest: { region: requestRegion } });
    onContinue(false);
  };

  return (
    <div>
      <p className="text-[15px] text-gray-500 leading-relaxed mb-6">
        Where do you want civic updates for? Start typing to see suggestions, or
        enter any city &mdash; if we don&rsquo;t cover it yet, we&rsquo;ll add you to
        the waitlist.
      </p>

      <label
        htmlFor="onb-region"
        className="block mb-3 text-[11px] font-bold text-gray-400 uppercase tracking-widest"
      >
        Region
      </label>

      <div ref={containerRef} className="relative">
        <div className="flex items-stretch border border-gray-200 rounded-xl overflow-hidden bg-white focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20">
          <div className="flex items-center justify-center px-3 border-r border-gray-200 bg-gray-50">
            <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
          </div>
          <input
            id="onb-region"
            type="text"
            autoComplete="off"
            placeholder="Start typing a city name…"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setPickedSuggestion(null);
              setError(null);
              setSuggestionsOpen(true);
            }}
            onFocus={() => setSuggestionsOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleContinue();
              }
              if (e.key === "Escape") {
                setSuggestionsOpen(false);
              }
            }}
            className="flex-1 min-w-0 px-3 py-3 text-[14.5px] text-gray-950 placeholder:text-gray-400 focus:outline-none"
            disabled={regionsLoading}
          />
        </div>

        {hasDropdown && (
          <ul
            className="absolute left-0 right-0 z-[60] mt-1 max-h-[320px] overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg"
            role="listbox"
          >
            {suggestions.length === 0 && suggestionsLoading && (
              <li className="px-3 py-3 text-[13px] text-gray-400">Searching…</li>
            )}
            {suggestions.map((s) => (
              <li key={s.label} role="option" aria-selected={pickedSuggestion?.name === s.name}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handlePick(s)}
                  className="w-full flex items-start gap-2 text-left px-3 py-2.5 text-[13.5px] hover:bg-gray-50"
                >
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    <span className="font-semibold text-gray-900">{s.name}</span>
                    {s.label !== s.name && (
                      <span className="text-gray-500">
                        {" — "}
                        {s.label.replace(`${s.name}, `, "")}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <p
          className="mt-2 text-[13px] text-red-700"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleContinue}
        disabled={regionsLoading || !input.trim()}
        className="mt-8 w-full sm:w-auto sm:min-w-[240px] inline-flex items-center justify-center min-h-[48px] px-8 py-3 text-[15.5px] font-bold text-white bg-brand rounded-xl hover:bg-brand-hover transition-colors shadow-sm disabled:opacity-50"
      >
        {regionsLoading ? "Loading…" : "Continue"}
      </button>
    </div>
  );
}
