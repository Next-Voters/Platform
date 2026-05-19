"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Search } from "lucide-react";

interface PhotonSuggestion {
  label: string;
  name: string;
  state: string | null;
  country: string | null;
}

interface RegionAutocompleteProps {
  value: string;
  onValueChange: (value: string, pickedFromSuggestions: boolean) => void;
  onSubmit?: () => void;
  disabled?: boolean;
  placeholder?: string;
  inputId?: string;
  variant?: "wizard" | "hero";
  autoFocus?: boolean;
}

export function RegionAutocomplete({
  value,
  onValueChange,
  onSubmit,
  disabled = false,
  placeholder = "Start typing a city name…",
  inputId,
  variant = "wizard",
  autoFocus = false,
}: RegionAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<PhotonSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [pickedRegion, setPickedCity] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trimmed = value.trim();
    if (trimmed.length < 2 || trimmed === pickedRegion) {
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
  }, [value, pickedRegion]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setSuggestionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePick = (name: string) => {
    setPickedCity(name);
    setSuggestions([]);
    setSuggestionsOpen(false);
    onValueChange(name, true);
  };

  const hasDropdown =
    suggestionsOpen && (suggestions.length > 0 || suggestionsLoading);

  const isHero = variant === "hero";

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className={
          isHero
            ? "flex items-stretch"
            : "flex items-stretch border border-gray-200 rounded-xl overflow-hidden bg-white focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20"
        }
      >
        <div
          className={
            isHero
              ? "flex items-center pl-4 pr-2"
              : "flex items-center justify-center px-3 border-r border-gray-200 bg-gray-50"
          }
        >
          <Search
            className={
              isHero
                ? "h-4 w-4 text-gray-500"
                : "h-4 w-4 text-gray-400"
            }
            aria-hidden="true"
          />
        </div>
        <input
          id={inputId}
          type="text"
          autoComplete="off"
          autoFocus={autoFocus}
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            setPickedCity("");
            setSuggestionsOpen(true);
            onValueChange(e.target.value, false);
          }}
          onFocus={() => setSuggestionsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSubmit?.();
            }
            if (e.key === "Escape") {
              setSuggestionsOpen(false);
            }
          }}
          className={
            isHero
              ? "flex-1 min-w-0 pl-1 pr-2 text-[17px] sm:text-[18.5px] text-gray-950 placeholder:text-gray-400 focus:outline-none bg-transparent h-16"
              : "flex-1 min-w-0 px-3 py-3 text-[14.5px] text-gray-950 placeholder:text-gray-400 focus:outline-none"
          }
          disabled={disabled}
        />
      </div>

      {hasDropdown && (
        <ul
          className="absolute left-0 right-0 top-full z-[60] mt-1 max-h-[320px] overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg"
          role="listbox"
        >
          {suggestions.length === 0 && suggestionsLoading && (
            <li className="px-3 py-3 text-[13px] text-gray-400">Searching…</li>
          )}
          {suggestions.map((s) => (
            <li
              key={s.label}
              role="option"
              aria-selected={pickedRegion === s.name}
            >
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handlePick(s.name)}
                className="w-full flex items-start gap-2 text-left px-3 py-2.5 text-[13.5px] hover:bg-gray-50"
              >
                <MapPin
                  className="w-4 h-4 text-gray-400 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>
                  <span className="font-semibold text-gray-900">{s.name}</span>
                  {s.label !== s.name && (
                    <span className="text-gray-500">
                      {" - "}
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
  );
}
