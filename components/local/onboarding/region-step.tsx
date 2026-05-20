"use client";

import { useEffect, useRef, useState } from "react";
import { Check, MapPin, Search } from "lucide-react";
import { type SupportedRegion } from "@/server-actions/get-supported-regions";
import { resolveRegionHierarchy, type PhotonSuggestion } from "@/lib/resolve-region-hierarchy";
import { OnboardingState, SelectedRegion } from "./types";

interface Props {
  state: OnboardingState;
  supportedRegions: SupportedRegion[];
  regionsLoading: boolean;
  updateState: (patch: Partial<OnboardingState>) => void;
  onContinue: (regionWasSupported: boolean) => void;
}

const TYPE_LABELS: Record<string, string> = {
  country: "Federal-level political updates",
  state: "State-level political updates",
  city: "City-level political updates",
};

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
  const [hierarchy, setHierarchy] = useState<SupportedRegion[]>([]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  // Autocomplete fetch
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

  // Close dropdown on outside click
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

    // Resolve hierarchy and show checkboxes
    const resolved = resolveRegionHierarchy(s, s.name, supportedRegions);
    setHierarchy(resolved);
    // Auto-check all free (non-city) levels
    const freeChecked = new Set(
      resolved.filter((r) => r.type !== "city").map((r) => r.region),
    );
    setChecked(freeChecked);
  };

  const toggleRegion = (region: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(region)) next.delete(region);
      else next.add(region);
      return next;
    });
  };

  const handleContinue = () => {
    setError(null);

    // If hierarchy is showing, save selections and proceed
    if (hierarchy.length > 0) {
      if (checked.size === 0) {
        setError("Select at least one coverage level.");
        return;
      }

      const selectedRegions: SelectedRegion[] = hierarchy
        .filter((r) => checked.has(r.region))
        .map((r) => ({ region: r.region, type: r.type }));

      // Primary region = most specific selected
      const typeOrder: Record<string, number> = { country: 0, state: 1, city: 2 };
      const primary = [...selectedRegions].sort(
        (a, b) => (typeOrder[b.type] ?? 0) - (typeOrder[a.type] ?? 0),
      )[0];

      updateState({
        region: primary.region,
        regionRequest: null,
        regionType: primary.type,
        selectedRegions,
      });
      onContinue(true);
      return;
    }

    // No hierarchy showing — resolve from input
    const trimmed = input.trim();
    if (!trimmed) {
      setError("Please enter your city.");
      return;
    }

    // Try to resolve hierarchy from typed text
    const resolved = resolveRegionHierarchy(pickedSuggestion, trimmed, supportedRegions);
    if (resolved.length > 0) {
      setHierarchy(resolved);
      const freeChecked = new Set(
        resolved.filter((r) => r.type !== "city").map((r) => r.region),
      );
      setChecked(freeChecked);
      return; // Show hierarchy, don't navigate yet
    }

    // No match — request flow
    const requestRegion = pickedSuggestion?.state ?? trimmed;
    updateState({
      region: "",
      regionRequest: { region: requestRegion },
      selectedRegions: [],
      regionType: null,
    });
    onContinue(false);
  };

  const hasCity = hierarchy.some((r) => r.type === "city" && checked.has(r.region));
  const canContinue =
    hierarchy.length === 0
      ? !regionsLoading && !!input.trim()
      : checked.size > 0;

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
              // Clear hierarchy when input changes
              setHierarchy([]);
              setChecked(new Set());
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

      {/* Hierarchy checkboxes — appear after picking a suggestion */}
      {hierarchy.length > 0 && (
        <div className="mt-5">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">
            Coverage levels
          </p>
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            {hierarchy.map((r, i) => {
              const isCity = r.type === "city";
              const isChecked = checked.has(r.region);
              return (
                <button
                  key={r.region}
                  type="button"
                  onClick={() => toggleRegion(r.region)}
                  className={[
                    "w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors",
                    i > 0 ? "border-t border-gray-200" : "",
                    isChecked ? "bg-brand/[0.04]" : "bg-white hover:bg-gray-50",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                      isChecked ? "border-brand bg-brand" : "border-gray-300",
                    ].join(" ")}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[14.5px] font-semibold text-gray-900">
                        {r.region}
                      </span>
                      {isCity && (
                        <span className="text-[10.5px] font-bold text-brand bg-brand/10 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                          Pro
                        </span>
                      )}
                    </div>
                    <p className="text-[12.5px] text-gray-500 mt-0.5">
                      {TYPE_LABELS[r.type]}
                    </p>
                    {isCity && isChecked && (
                      <p className="text-[12px] text-brand/80 mt-1">
                        You&rsquo;ll choose your plan in the next step
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          {hasCity && (
            <p className="mt-2.5 text-[12.5px] text-gray-500">
              City-level coverage is a Pro feature. State and country are free.
            </p>
          )}
        </div>
      )}

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
        disabled={!canContinue}
        className="mt-8 w-full sm:w-auto sm:min-w-[240px] inline-flex items-center justify-center min-h-[48px] px-8 py-3 text-[15.5px] font-bold text-white bg-brand rounded-xl hover:bg-brand-hover transition-colors shadow-sm disabled:opacity-50"
      >
        {regionsLoading ? "Loading…" : "Continue"}
      </button>
    </div>
  );
}
